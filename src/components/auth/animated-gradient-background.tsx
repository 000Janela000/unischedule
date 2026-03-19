"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener("resize", resize)

    const colors = [
      { r: 99, g: 102, b: 241 },   // Indigo
      { r: 139, g: 92, b: 246 },   // Purple
      { r: 79, g: 70, b: 229 },    // Indigo darker
      { r: 167, g: 139, b: 250 },  // Purple lighter
    ]

    const blobs = colors.map((color, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.min(canvas.width, canvas.height) * (0.3 + Math.random() * 0.2),
      color,
      phase: i * Math.PI * 0.5,
    }))

    const animate = () => {
      time += 0.003

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "rgb(30, 27, 75)")    // Dark indigo
      gradient.addColorStop(0.5, "rgb(49, 46, 129)") // Indigo
      gradient.addColorStop(1, "rgb(76, 29, 149)")   // Purple
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Animate blobs
      blobs.forEach((blob) => {
        blob.x += blob.vx + Math.sin(time + blob.phase) * 0.5
        blob.y += blob.vy + Math.cos(time + blob.phase) * 0.5

        // Bounce off edges
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius
        if (blob.y < -blob.radius) blob.y = canvas.height + blob.radius
        if (blob.y > canvas.height + blob.radius) blob.y = -blob.radius

        // Draw blob with gradient
        const blobGradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        )
        blobGradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.4)`)
        blobGradient.addColorStop(0.5, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.2)`)
        blobGradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`)

        ctx.fillStyle = blobGradient
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Add subtle noise overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)"
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = Math.random() * 2
        ctx.fillRect(x, y, size, size)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [prefersReducedMotion])

  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900"
        aria-hidden="true"
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
    />
  )
}
