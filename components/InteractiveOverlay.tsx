import React, { useEffect, useState, useRef } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    velocity: { x: number; y: number };
}

export const InteractiveOverlay: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const cursorRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    // Mouse trail / Glow effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }
            if (glowRef.current) {
                // Add a slight delay/lag for the glow for a smoother feel
                glowRef.current.animate({
                    left: `${e.clientX}px`,
                    top: `${e.clientY}px`
                }, { duration: 500, fill: 'forwards' });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Click particles
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newParticles: Particle[] = [];
            const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6'];

            for (let i = 0; i < 8; i++) {
                newParticles.push({
                    id: Date.now() + i,
                    x: e.clientX,
                    y: e.clientY,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: Math.random() * 6 + 4,
                    velocity: {
                        x: (Math.random() - 0.5) * 4,
                        y: (Math.random() - 0.5) * 4
                    }
                });
            }

            setParticles(prev => [...prev, ...newParticles]);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Animation loop for particles
    useEffect(() => {
        if (particles.length === 0) return;

        const interval = setInterval(() => {
            setParticles(prev => prev.map(p => ({
                ...p,
                x: p.x + p.velocity.x,
                y: p.y + p.velocity.y,
                size: p.size * 0.9 // Fade out by shrinking
            })).filter(p => p.size > 0.5));
        }, 16);

        return () => clearInterval(interval);
    }, [particles.length]);

    // Hide system cursor
    useEffect(() => {
        document.body.style.cursor = 'none';

        // Also add a class to ensure it overrides other styles if needed
        const style = document.createElement('style');
        style.innerHTML = `
            * { cursor: none !important; }
            a, button, [role="button"], input, select, textarea { cursor: none !important; }
        `;
        style.id = 'custom-cursor-style';
        document.head.appendChild(style);

        return () => {
            document.body.style.cursor = '';
            const existingStyle = document.getElementById('custom-cursor-style');
            if (existingStyle) existingStyle.remove();
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {/* Custom Cursor Dot */}
            <div
                ref={cursorRef}
                className="absolute w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out mix-blend-difference z-[10000] border border-black/20"
                style={{ left: 0, top: 0 }}
            />

            {/* Glow Effect */}
            <div
                ref={glowRef}
                className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
                style={{ left: '50%', top: '50%' }}
            />

            {/* Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: p.x,
                        top: p.y,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        transform: 'translate(-50%, -50%)',
                        opacity: p.size / 10
                    }}
                />
            ))}
        </div>
    );
};
