'use client'

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface Star {
    x: number; y: number;
    size: number; opacity: number;
    vx: number; vy: number;
    twinkleSpeed: number; twinkleOffset: number;
}

export const NebulaCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorTarget = useRef({ x: -999, y: -999 });
    const cursorSmooth = useRef({ x: -999, y: -999 });
    const frameRef = useRef(0);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { damping: 30, stiffness: 50 });
    const springY = useSpring(mouseY, { damping: 30, stiffness: 50 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const STAR_COUNT = 150;
        const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 1.4 + 0.3,
            opacity: Math.random() * 0.5 + 0.15,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1,
            twinkleSpeed: Math.random() * 0.018 + 0.004,
            twinkleOffset: Math.random() * Math.PI * 2,
        }));

        const onMouseMove = (e: MouseEvent) => {
            cursorTarget.current = { x: e.clientX, y: e.clientY };
            mouseX.set((e.clientX - window.innerWidth / 2) / 3);
            mouseY.set((e.clientY - window.innerHeight / 2) / 3);
        };
        window.addEventListener('mousemove', onMouseMove);

        let tick = 0;
        const draw = () => {
            tick++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            cursorSmooth.current.x += (cursorTarget.current.x - cursorSmooth.current.x) * 0.1;
            cursorSmooth.current.y += (cursorTarget.current.y - cursorSmooth.current.y) * 0.1;

            for (const star of stars) {
                star.x += star.vx;
                star.y += star.vy;
                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;

                const twinkle = Math.sin(tick * star.twinkleSpeed + star.twinkleOffset);
                const op = star.opacity * (0.65 + 0.35 * twinkle);
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${op.toFixed(3)})`;
                ctx.fill();
            }

            const cx = cursorSmooth.current.x;
            const cy = cursorSmooth.current.y;
            if (cx > 0 && cy > 0) {
                const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
                halo.addColorStop(0, 'rgba(255,255,255,0.1)');
                halo.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = halo;
                ctx.beginPath();
                ctx.arc(cx, cy, 100, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.fill();

                const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
                ig.addColorStop(0, 'rgba(255,255,255,0.4)');
                ig.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(cx, cy, 12, 0, Math.PI * 2);
                ctx.fillStyle = ig;
                ctx.fill();
            }

            frameRef.current = requestAnimationFrame(draw);
        };
        frameRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('mousemove', onMouseMove);
            ro.disconnect();
        };
    }, [mouseX, mouseY]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-black" />

            <motion.div
                style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
                className="absolute top-1/2 left-1/2 w-[800px] h-[800px] pointer-events-none"
            >
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 62% 45%, rgba(0,210,190,0.5) 0%, transparent 55%)',
                    filter: 'blur(90px)',
                    mixBlendMode: 'screen',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 38% 58%, rgba(255,100,45,0.38) 0%, transparent 52%)',
                    filter: 'blur(110px)',
                    mixBlendMode: 'screen',
                }} />
            </motion.div>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ display: 'block', background: 'transparent' }}
            />
        </div>
    );
};
