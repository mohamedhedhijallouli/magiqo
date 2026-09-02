import React, { useEffect, useRef } from "react";

export default function StarsBackground({ density = 110 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let stars = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 * devicePixelRatio + 0.3,
        s: Math.random() * 0.4 + 0.1,
        tw: Math.random() * Math.PI * 2,
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const st of stars) {
        st.tw += 0.02;
        const alpha = 0.35 + Math.sin(st.tw) * 0.35;
        ctx.beginPath();
        ctx.fillStyle = `rgba(232,178,77,${Math.max(0.1, alpha)})`;
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
        if (!reduced) {
          st.y += st.s;
          if (st.y > canvas.height) st.y = 0;
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-70" />;
}
