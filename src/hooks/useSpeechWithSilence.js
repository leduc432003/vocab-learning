import { useRef, useCallback, useEffect } from "react";
import { useShallow } from 'zustand/react/shallow';
import { useSpeechStore } from "../store/use-speech-store";
import { toast } from "react-hot-toast";

export function useSpeechWithSilence(onSilence, silenceDuration = 3000, volumeThreshold = 15) {
    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const finalTranscriptRef = useRef("");

    // Use useShallow to prevent unnecessary re-renders and the getSnapshot infinite loop error
    const {
        isListening,
        setIsListening,
        setTranscript,
        setInterimTranscript,
        updateFinalTranscript,
        setSupported,
        setLoading
    } = useSpeechStore(useShallow(state => ({
        isListening: state.isListening,
        setIsListening: state.setListening,
        setTranscript: state.setTranscript,
        setInterimTranscript: state.setInterimTranscript,
        updateFinalTranscript: state.updateFinalTranscript,
        setSupported: state.setSupported,
        setLoading: state.setLoading
    })));

    const stop = useCallback((isManual = true) => {
        console.log('[useSpeechWithSilence] stop() called, manual:', isManual);

        if (recognitionRef.current) {
            try {
                recognitionRef.current.onstart = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.stop();
            } catch (e) { }
            recognitionRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        setIsListening(false);
        setInterimTranscript("");

        if (!isManual && onSilence && finalTranscriptRef.current) {
            const finalResult = finalTranscriptRef.current.trim();
            onSilence(finalResult);
        }
    }, [onSilence, setIsListening, setInterimTranscript]);

    const detectSilence = useCallback(() => {
        const analyser = analyserRef.current;
        if (!analyser) return;

        const data = new Uint8Array(analyser.frequencyBinCount);

        const check = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(data);
            const volume = data.reduce((a, b) => a + b, 0) / data.length;

            if (volume > volumeThreshold) {
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                }
                silenceTimerRef.current = setTimeout(() => stop(false), silenceDuration);
            }

            animationFrameRef.current = requestAnimationFrame(check);
        };

        silenceTimerRef.current = setTimeout(() => stop(false), silenceDuration);
        check();
    }, [stop, silenceDuration, volumeThreshold]);

    const start = async (retryCount = 0) => {
        console.log(`[useSpeechWithSilence] start() (retry: ${retryCount})`);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSupported(false);
            toast.error("Browser does not support Speech Recognition");
            return;
        }

        if (isListening) {
            stop(true);
            return;
        }

        try {
            setLoading(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => {
                setLoading(false);
                setIsListening(true);
                setInterimTranscript("");
                setTranscript("");
                finalTranscriptRef.current = "";
            };

            recognition.onresult = (event) => {
                let currentInterimTranscript = "";
                let newFinalTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const transcriptText = result[0].transcript;

                    if (result.isFinal) {
                        newFinalTranscript += transcriptText + " ";
                    } else {
                        currentInterimTranscript += transcriptText;
                    }
                }

                if (newFinalTranscript) {
                    finalTranscriptRef.current += newFinalTranscript;
                    updateFinalTranscript(newFinalTranscript);
                }
                setInterimTranscript(currentInterimTranscript);
            };

            recognition.onend = () => {
                setIsListening(false);
                setInterimTranscript("");
            };

            recognition.onerror = (event) => {
                console.error('[useSpeechWithSilence] onerror:', event.error);
                setLoading(false);
                if (retryCount < 2 && (event.error === 'network' || event.error === 'aborted')) {
                    setTimeout(() => start(retryCount + 1), 500);
                } else {
                    setIsListening(false);
                    if (event.error !== 'aborted' && event.error !== 'no-speech') {
                        toast.error(`Recording error: ${event.error}`);
                    }
                }
            };

            recognitionRef.current = recognition;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            recognition.start();
            detectSilence();
        } catch (err) {
            console.error("[useSpeechWithSilence] Error:", err);
            setLoading(false);
            setIsListening(false);
            if (err.name === 'NotAllowedError') {
                toast.error("Please allow microphone access");
            }
        }
    };

    useEffect(() => {
        return () => stop(true);
    }, [stop]);

    return {
        start,
        stop,
    };
}
