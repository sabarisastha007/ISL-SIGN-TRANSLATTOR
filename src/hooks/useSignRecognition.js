import { useCallback, useEffect, useRef, useState } from 'react';
import { initRecognition, recognizeFrame, createStabilizer, CONNECTIONS } from '../services/signRecognitionService';
import { checkHealth, predictImage, isValidPrediction, disambiguatePrediction } from '../services/remoteRecognitionService';

const FRAME_MS = 66; // ~15 fps is plenty for word-level signs and keeps CPU low
const IDLE = {
  running: false,
  loading: false,
  error: null,
  hand: false,
  word: null,
  confidence: 0,
  progress: 0,
  status: 'idle',
  remoteAvailable: false,
  remoteError: null,
  _predictInFlight: false,
  backendStatus: 'checking',
  debugInfo: {
    cropPreview: null,
    handsCount: 0,
    rawWord: null,
    rawConfidence: 0,
    top3: [],
    disambiguatedWord: null,
    rule: null,
  },
};

function camError(e) {
  if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') return 'err_cam_denied';
  if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') return 'err_cam_none';
  return 'err_cam_generic';
}

/** Camera + recognition loop. Calls onWord(word, confidence) when the stabilizer commits a word. */
export function useSignRecognition({ videoRef, canvasRef, onWord }) {
  const [state, setState] = useState(IDLE);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const activeRef = useRef(false);
  const abortControllerRef = useRef(null);
  const reqSeqRef = useRef(0);

  // Stabilizers for remote and fallback heuristics
  const remoteStabRef = useRef(null);
  const heuristicStabRef = useRef(null);

  const onWordRef = useRef(onWord);
  const remoteAvailableRef = useRef(false);
  const predictInFlightRef = useRef(false);
  const offscreenCanvasRef = useRef(null);

  useEffect(() => {
    onWordRef.current = onWord;
  }, [onWord]);

  const clearCanvas = () => {
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  };

  const stop = useCallback((error = null) => {
    activeRef.current = false;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    cancelAnimationFrame(rafRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.srcObject = null;
      } catch {
        // ignore video pause errors on cleanup
      }
    }

    remoteStabRef.current?.reset();
    remoteStabRef.current = null;
    heuristicStabRef.current?.reset();
    heuristicStabRef.current = null;
    remoteAvailableRef.current = false;
    predictInFlightRef.current = false;
    clearCanvas();

    setState({ ...IDLE, error });
  }, [videoRef, canvasRef]);

  const draw = (allLm) => {
    const c = canvasRef.current;
    const v = videoRef.current;
    if (!c || !v) return;
    if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
      c.width = v.videoWidth;
      c.height = v.videoHeight;
    }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (!allLm || allLm.length === 0) return;

    ctx.lineWidth = 3;
    allLm.forEach((lm, idx) => {
      if (!lm || lm.length < 21) return;
      ctx.strokeStyle = idx === 0 ? 'rgba(99,102,241,0.95)' : 'rgba(168,85,247,0.95)';
      ctx.fillStyle = idx === 0 ? '#22d3ee' : '#f472b6';
      ctx.beginPath();
      CONNECTIONS.forEach(([a, b]) => {
        if (lm[a] && lm[b]) {
          ctx.moveTo(lm[a].x * c.width, lm[a].y * c.height);
          ctx.lineTo(lm[b].x * c.width, lm[b].y * c.height);
        }
      });
      ctx.stroke();
      lm.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * c.width, p.y * c.height, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  };

  const start = useCallback(async () => {
    if (activeRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ ...IDLE, error: 'err_cam_unsupported' });
      return;
    }

    activeRef.current = true;
    abortControllerRef.current = new AbortController();
    setState({ ...IDLE, loading: true, status: 'loading', backendStatus: 'checking' });

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
    } catch (e) {
      activeRef.current = false;
      setState({ ...IDLE, error: camError(e) });
      return;
    }

    if (!activeRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;

    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        /* autoplay quirks */
      }
    }

    try {
      await initRecognition();
    } catch (e) {
      console.error('[isl] model load failed', e);
      stop('err_model');
      return;
    }

    if (!activeRef.current) return;

    // Check remote backend health with timeout and cancellation
    try {
      const healthPromise = checkHealth({ signal: abortControllerRef.current?.signal });
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 4000));
      await Promise.race([healthPromise, timeout]);
      if (activeRef.current) {
        remoteAvailableRef.current = true;
        setState((s) => ({ ...s, remoteAvailable: true, backendStatus: 'available' }));
      }
    } catch (e) {
      if (activeRef.current) {
        console.warn('Remote model health check failed', e);
        remoteAvailableRef.current = false;
        setState((s) => ({ ...s, remoteAvailable: false, remoteError: e.message, backendStatus: 'fallback' }));
      }
    }

    if (!activeRef.current) return;

    heuristicStabRef.current = createStabilizer({ holdMs: 650, cooldownMs: 600 });
    remoteStabRef.current = createStabilizer({ holdMs: 600, cooldownMs: 500 });
    setState((s) => ({ ...s, running: true, loading: false, status: 'no_hand' }));

    const loop = (now) => {
      if (!activeRef.current) return;
      rafRef.current = requestAnimationFrame(loop);
      if (now - lastRef.current < FRAME_MS) return;
      lastRef.current = now;

      const v = videoRef.current;
      if (!v || v.readyState < 2 || !v.videoWidth) return;

      let res;
      try {
        res = recognizeFrame(v, performance.now());
      } catch (e) {
        console.error(e);
        return;
      }
      draw(res?.allLandmarks ?? (res?.landmarks ? [res.landmarks] : []));

      const t = performance.now();

      // Hand detected branch:
      if (res?.handDetected) {
        // If remote backend is available, use remote image classification:
        if (remoteAvailableRef.current) {
          if (!predictInFlightRef.current) {
            predictInFlightRef.current = true;
            setState((s) => ({ ...s, _predictInFlight: true }));
            const currentSeq = ++reqSeqRef.current;

            try {
              if (!offscreenCanvasRef.current) {
                offscreenCanvasRef.current = document.createElement('canvas');
                offscreenCanvasRef.current.width = 128;
                offscreenCanvasRef.current.height = 128;
              }
              const oc = offscreenCanvasRef.current;
              const octx = oc.getContext('2d');

              // Clear previous frame pixels to avoid ghosting
              octx.clearRect(0, 0, 128, 128);

              // Crop to multi-hand bounding box (supporting 1-hand signs like L and 2-hand ISL signs like A, B)
              const allHands = res.allLandmarks && res.allLandmarks.length > 0
                ? res.allLandmarks
                : (res.landmarks ? [res.landmarks] : []);
              const allPoints = allHands.flat();

              if (allPoints.length >= 21) {
                const xs = allPoints.map((p) => p.x * v.videoWidth);
                const ys = allPoints.map((p) => p.y * v.videoHeight);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                const handW = Math.max(30, maxX - minX);
                const handH = Math.max(30, maxY - minY);
                // Tight padding matching training dataset bounding box framing
                const padX = handW * 0.12;
                const padY = handH * 0.12;
                const wristPad = handH * 0.16;
                const sx = Math.max(0, minX - padX);
                const sy = Math.max(0, minY - padY);
                const sw = Math.min(v.videoWidth - sx, handW + padX * 2);
                const sh = Math.min(v.videoHeight - sy, handH + padY + wristPad);
                octx.drawImage(v, sx, sy, sw, sh, 0, 0, 128, 128);
              } else {
                octx.drawImage(v, 0, 0, 128, 128);
              }
              const base64 = oc.toDataURL('image/jpeg', 0.85);

              predictImage(base64, { signal: abortControllerRef.current?.signal })
                .then((data) => {
                  predictInFlightRef.current = false;
                  // Guard against stale response or stopped camera
                  if (!activeRef.current || currentSeq !== reqSeqRef.current) return;

                  const valid = isValidPrediction(data, 0.45);
                  const remoteStab = remoteStabRef.current;
                  let word = valid ? data.word : null;
                  let conf = valid ? data.confidence : 0;
                  let rule = null;
                  let geomCandidate = null;
                  let geomConf = 0;

                  // Refine prediction with landmark geometry if available (supports multi-hand A/B and single-hand L)
                  const primaryLm = res.landmarks || allHands[0];
                  if (word && primaryLm && primaryLm.length >= 21) {
                    const refined = disambiguatePrediction(word, conf, primaryLm, allHands);
                    word = refined.word;
                    conf = refined.confidence;
                    rule = refined.rule;
                    geomCandidate = refined.candidate;
                    geomConf = refined.candidateConfidence;
                  }

                  let committed = null;
                  if (remoteStab) {
                    committed = remoteStab.update(word, performance.now());
                    if (committed) {
                      onWordRef.current?.(committed, conf);
                    }
                  }

                  const progress = remoteStab ? Math.round(remoteStab.holdProgress(performance.now()) * 10) / 10 : 0;
                  const isLocked = remoteStab?.isLocked?.();
                  const status = !word ? 'unknown' : isLocked ? 'added' : 'holding';

                  setState((s) => ({
                    ...s,
                    _predictInFlight: false,
                    hand: true,
                    word,
                    confidence: Math.round(conf * 20) / 20,
                    progress,
                    status,
                    debugInfo: {
                      cropPreview: base64,
                      handsCount: allHands.length,
                      rawWord: data.word,
                      rawConfidence: data.confidence,
                      geometryCandidate: geomCandidate,
                      geometryConfidence: geomConf,
                      top3: data.top3 || [],
                      disambiguatedWord: word,
                      rule,
                    },
                  }));
                })
                .catch((err) => {
                  predictInFlightRef.current = false;
                  if (!activeRef.current) return;
                  if (err.name === 'AbortError') return;

                  console.warn('Remote predict error, falling back to heuristic:', err);
                  remoteAvailableRef.current = false;
                  remoteStabRef.current?.reset();
                  remoteStabRef.current = null;
                  setState((s) => ({
                    ...s,
                    remoteAvailable: false,
                    remoteError: err.message,
                    _predictInFlight: false,
                    backendStatus: 'fallback',
                  }));
                });
            } catch {
              predictInFlightRef.current = false;
              setState((s) => ({ ...s, _predictInFlight: false }));
            }
          }
        } else {
          // Heuristic fallback mode
          const stab = heuristicStabRef.current;
          const committed = stab ? stab.update(res.word, t) : null;
          if (committed) {
            onWordRef.current?.(committed, res.confidence);
          }

          const status = !res.word ? 'unknown' : stab?.isLocked() ? 'added' : 'holding';
          const next = {
            hand: true,
            word: res.word,
            confidence: Math.round(res.confidence * 20) / 20,
            progress: stab ? Math.round(stab.holdProgress(t) * 10) / 10 : 0,
            status,
            debugInfo: {
              cropPreview: null,
              handsCount: res.allLandmarks ? res.allLandmarks.length : 1,
              rawWord: res.word,
              rawConfidence: res.confidence,
              top3: [],
              disambiguatedWord: res.word,
              rule: 'heuristic fallback',
            },
          };
          setState((s) => (
            s.hand === next.hand &&
            s.word === next.word &&
            s.confidence === next.confidence &&
            s.progress === next.progress &&
            s.status === next.status
              ? s
              : { ...s, ...next }
          ));
        }
      } else {
        // No hand detected in frame:
        remoteStabRef.current?.update(null, t);
        heuristicStabRef.current?.update(null, t);

        const next = {
          hand: false,
          word: null,
          confidence: 0,
          progress: 0,
          status: 'no_hand',
          debugInfo: {
            cropPreview: null,
            handsCount: 0,
            rawWord: null,
            rawConfidence: 0,
            top3: [],
            disambiguatedWord: null,
            rule: null,
          },
        };
        setState((s) => (
          s.hand === next.hand &&
          s.word === next.word &&
          s.confidence === next.confidence &&
          s.progress === next.progress &&
          s.status === next.status
            ? s
            : { ...s, ...next }
        ));
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [stop, videoRef, canvasRef]);

  useEffect(() => () => stop(), [stop]);

  return { state, start, stop: () => stop() };
}
