'use client';

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { motion, useMotionValue, useTransform, useMotionTemplate } from 'framer-motion';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) => {
  const [showContent, setShowContent] = useState<boolean>(false);
  const [, setMediaFullyExpanded] = useState<boolean>(false);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  const scrollProgress = useMotionValue(0);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const isExpandedRef = useRef<boolean>(false);
  const touchStartYRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    targetProgressRef.current = 0;
    currentProgressRef.current = 0;
    isExpandedRef.current = false;
    scrollProgress.set(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType, scrollProgress]);

  // Smooth requestAnimationFrame lerp loop
  useEffect(() => {
    let active = true;

    const updateFrame = () => {
      if (!active) return;

      const target = targetProgressRef.current;
      const current = currentProgressRef.current;

      // Smooth linear interpolation (lerp)
      const diff = target - current;
      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current = current + diff * 0.25; // Increased from 0.14 for snappier response
        const rounded = Math.round(currentProgressRef.current * 10000) / 10000;
        scrollProgress.set(rounded);

        if (rounded >= 0.98 && !isExpandedRef.current) {
          isExpandedRef.current = true;
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (rounded < 0.75 && isExpandedRef.current) {
          isExpandedRef.current = false;
          setMediaFullyExpanded(false);
          setShowContent(false);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(updateFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(updateFrame);

    return () => {
      active = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [scrollProgress]);

  // Event Listeners attached ONCE without re-attaching churn
  useEffect(() => {
    const handleWheel = (e: globalThis.WheelEvent) => {
      if (isExpandedRef.current && e.deltaY < 0 && window.scrollY <= 5) {
        isExpandedRef.current = false;
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!isExpandedRef.current) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0015; // Increased from 0.0008 for faster scrolling
        targetProgressRef.current = Math.min(
          Math.max(targetProgressRef.current + scrollDelta, 0),
          1
        );
      }
    };

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!touchStartYRef.current) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - touchY;

      if (isExpandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        isExpandedRef.current = false;
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!isExpandedRef.current) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.006;
        const scrollDelta = deltaY * scrollFactor;
        targetProgressRef.current = Math.min(
          Math.max(targetProgressRef.current + scrollDelta, 0),
          1
        );
        touchStartYRef.current = touchY;
      }
    };

    const handleTouchEnd = (): void => {
      touchStartYRef.current = 0;
    };

    const handleScroll = (): void => {
      if (!isExpandedRef.current && targetProgressRef.current < 0.95) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  // Calculate max dimensions
  const mediaMaxWidth = isMobileState ? 950 : 1550;
  const mediaMaxHeight = isMobileState ? 600 : 800;
  const initialWidth = 300;
  const initialHeight = 400;

  // Clip path insets for GPU accelerated expansion
  const xInset = useTransform(scrollProgress, [0, 1], [(mediaMaxWidth - initialWidth) / 2, 0]);
  const yInset = useTransform(scrollProgress, [0, 1], [(mediaMaxHeight - initialHeight) / 2, 0]);
  const clipPath = useMotionTemplate`inset(${yInset}px ${xInset}px round 16px)`;

  // Glow scale values
  const glowScaleX = useTransform(scrollProgress, [0, 1], [initialWidth / mediaMaxWidth, 1]);
  const glowScaleY = useTransform(scrollProgress, [0, 1], [initialHeight / mediaMaxHeight, 1]);

  const textTranslateX = useTransform(scrollProgress, [0, 1], [0, isMobileState ? 180 : 150]);
  const textTranslateXNegative = useTransform(scrollProgress, [0, 1], [0, -(isMobileState ? 180 : 150)]);
  
  const currentHue = useTransform(scrollProgress, [0, 1], [135, 170]);
  const huePlus25 = useTransform(currentHue, h => h + 25);
  const huePlus30 = useTransform(currentHue, h => h + 30);
  
  const dynamicGlowColor = useMotionTemplate`hsla(${currentHue}, 85%, 45%, ${useTransform(scrollProgress, [0, 1], [0.4, 0.65])})`;
  const dynamicBorderColor = useMotionTemplate`hsla(${currentHue}, 80%, 45%, ${useTransform(scrollProgress, [0, 1], [0.35, 0.7])})`;
  
  const shadow1Size = useTransform(scrollProgress, [0, 1], [45, 90]);
  const shadow2Size = useTransform(scrollProgress, [0, 1], [95, 150]);
  const boxShadow = useMotionTemplate`0px 0px ${shadow1Size}px ${dynamicGlowColor}, 0px 0px ${shadow2Size}px hsla(${currentHue}, 75%, 35%, 0.3)`;
  
  const bgImageOpacity = useTransform(scrollProgress, [0, 1], [0.75, 0.4]);
  const mediaOverlayOpacity = useTransform(scrollProgress, [0, 1], [0.5, 0.2]);

  const bgRadial = useMotionTemplate`radial-gradient(circle at 50% 25%, hsla(${currentHue}, 75%, 10%, 0.85) 0%, hsla(${huePlus25}, 80%, 5%, 0.96) 55%, #030a08 100%)`;
  const bgLinear = useMotionTemplate`linear-gradient(180deg, hsla(${currentHue}, 80%, 8%, 0.35) 0%, hsla(${huePlus30}, 75%, 4%, 0.75) 70%, #030a08 100%)`;

  const dateColor = useMotionTemplate`hsla(${currentHue}, 90%, 75%, 1)`;
  const titleFilter = useMotionTemplate`drop-shadow(0 0 25px hsla(${currentHue}, 85%, 45%, 0.75))`;

  return (
    <div
      ref={sectionRef}
      className='transition-colors duration-700 ease-in-out overflow-x-hidden'
    >
      <section className='relative flex flex-col items-center justify-start min-h-[100dvh]'>
        <div className='relative w-full flex flex-col items-center min-h-[100dvh]'>
          <motion.div
            className='absolute inset-0 z-0 w-full h-full transition-all duration-300'
            style={{ background: bgRadial }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            <motion.img
              src={bgImageSrc}
              alt='Background'
              className='w-full h-full object-cover object-center transition-opacity duration-500'
              style={{ opacity: bgImageOpacity }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Dynamic Eco Color Tint Overlay */}
            <motion.div
              className='absolute inset-0 transition-colors duration-500'
              style={{
                background: bgLinear,
                backdropFilter: 'blur(2px)',
              }}
            />
          </motion.div>

          <div className='w-full flex flex-col items-center justify-start relative z-10'>
            <div className='flex flex-col items-center justify-center w-full h-[100dvh] relative'>
              
              {/* GPU-Accelerated Glow Container */}
              <motion.div
                className='absolute z-0 top-1/2 left-1/2 rounded-2xl border'
                style={{
                  width: `${mediaMaxWidth}px`,
                  height: `${mediaMaxHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  x: '-50%',
                  y: '-50%',
                  scaleX: glowScaleX,
                  scaleY: glowScaleY,
                  borderColor: dynamicBorderColor,
                  boxShadow: boxShadow,
                  willChange: 'transform',
                }}
              />

              {/* Main Media Container with clip-path */}
              <motion.div
                className='absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden'
                style={{
                  width: `${mediaMaxWidth}px`,
                  height: `${mediaMaxHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  clipPath: clipPath,
                  willChange: 'clip-path',
                }}
              >
                {mediaType === 'video' ? (
                  mediaSrc.includes('youtube.com') ? (
                    <div className='relative w-full h-full pointer-events-none'>
                      <iframe
                        width='100%'
                        height='100%'
                        src={
                          mediaSrc.includes('embed')
                            ? mediaSrc +
                              (mediaSrc.includes('?') ? '&' : '?') +
                              'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                            : mediaSrc.replace('watch?v=', 'embed/') +
                              '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                              mediaSrc.split('v=')[1]
                        }
                        className='w-full h-full'
                        frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                      />
                      <div
                        className='absolute inset-0 z-10'
                        style={{ pointerEvents: 'none' }}
                      ></div>

                      <motion.div
                        className='absolute inset-0 bg-slate-950/40'
                        style={{ opacity: mediaOverlayOpacity }}
                      />
                    </div>
                  ) : (
                    <div className='relative w-full h-full pointer-events-none'>
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload='auto'
                        className='w-full h-full object-cover'
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <div
                        className='absolute inset-0 z-10'
                        style={{ pointerEvents: 'none' }}
                      ></div>

                      <motion.div
                        className='absolute inset-0 bg-slate-950/40'
                        style={{ opacity: mediaOverlayOpacity }}
                      />
                    </div>
                  )
                ) : (
                  <div className='relative w-full h-full'>
                    <img
                      src={mediaSrc}
                      alt={title || 'Media content'}
                      className='w-full h-full object-cover'
                    />

                    <motion.div
                      className='absolute inset-0 bg-slate-950/50'
                      style={{ opacity: mediaOverlayOpacity }}
                    />
                  </div>
                )}
              </motion.div>

              <div className='flex flex-col items-center text-center relative z-20 mt-4 transition-none px-4 pointer-events-none'>
                {date && (
                  <motion.p
                    className='text-xs font-mono font-semibold uppercase tracking-widest bg-emerald-950/90 backdrop-blur-md px-3.5 py-1 rounded-full border shadow-lg transition-all duration-300'
                    style={{
                      x: textTranslateXNegative,
                      color: dateColor,
                      borderColor: dynamicBorderColor,
                      boxShadow: useMotionTemplate`0 0 20px ${dynamicGlowColor}`,
                    }}
                  >
                    {date}
                  </motion.p>
                )}
                {scrollToExpand && (
                  <motion.p
                    className='text-emerald-100 font-mono text-xs uppercase tracking-wider mt-2 bg-emerald-950/60 backdrop-blur-sm px-2.5 py-0.5 rounded-md border border-emerald-500/20'
                    style={{ x: textTranslateX }}
                  >
                    {scrollToExpand}
                  </motion.p>
                )}
              </div>

              <div
                className={`flex items-center justify-center text-center gap-2 w-full relative z-30 transition-none flex-col pointer-events-none ${
                  textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
                }`}
              >
                <motion.h2
                  className='text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-green-300 to-teal-200'
                  style={{
                    x: textTranslateXNegative,
                    willChange: 'transform',
                    filter: titleFilter,
                  }}
                >
                  {firstWord}
                </motion.h2>
                <motion.h2
                  className='text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-200'
                  style={{
                    x: textTranslateX,
                    willChange: 'transform',
                    filter: titleFilter,
                  }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            <motion.section
              className='flex flex-col w-full'
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;

