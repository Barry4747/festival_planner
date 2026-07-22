import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollCanvasProps {
  frameCount: number;
  urlTemplate: string; // e.g., "/frames/frame_{index}.webp"
  onProgress?: (loaded: number, total: number) => void;
  onLoaded?: () => void;
}

export const ScrollCanvas: React.FC<ScrollCanvasProps> = ({ frameCount, urlTemplate, onProgress, onLoaded }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const playhead = useRef({ frame: 0 });

  useEffect(() => {
    let isMounted = true;
    const images: HTMLImageElement[] = new Array(frameCount);
    imagesRef.current = images;

    // Step 1: Load ONLY the first frame
    const firstImg = new Image();
    firstImg.src = urlTemplate.replace('{index}', (1).toString().padStart(4, '0'));

    firstImg.onload = () => {
      if (!isMounted) return;
      images[0] = firstImg;
      
      // Instant First Frame Render
      renderFrame(0);

      let loadedCount = 1;
      if (onProgress) onProgress(loadedCount, frameCount);

      const handleLoad = (index: number) => {
        if (!isMounted) return;
        loadedCount++;
        if (onProgress) onProgress(loadedCount, frameCount);
        if (loadedCount === frameCount && onLoaded) onLoaded();
        if (playhead.current.frame === index) renderFrame(index);
      };

      // Step 2: Non-blocking Background Preload for the remaining frames
      for (let i = 2; i <= frameCount; i++) {
        const img = new Image();
        img.src = urlTemplate.replace('{index}', i.toString().padStart(4, '0'));
        img.onload = () => {
          if (isMounted) images[i - 1] = img;
          handleLoad(i - 1);
        };
        img.onerror = () => handleLoad(i - 1);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [frameCount, urlTemplate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use the closest parent section as the ScrollTrigger trigger
    const triggerElement = canvas.closest('section');
    if (!triggerElement) return;

    const ctx = gsap.context(() => {
      gsap.to(playhead.current, {
        frame: frameCount - 1,
        snap: 'frame',
        ease: 'none',
        scrollTrigger: {
          trigger: triggerElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
        },
        onUpdate: () => {
          renderFrame(playhead.current.frame);
        }
      });
    }, triggerElement); // scoping to the section

    return () => ctx.revert();
  }, [frameCount]);

  useEffect(() => {
    const handleResize = () => {
      renderFrame(playhead.current.frame);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width, img.height,
      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-cover"
      style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
};
