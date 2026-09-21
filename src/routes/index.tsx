import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/')({
  component: Game,
})

type Phase = 'title' | 'running'

function Game() {
  const [phase, setPhase] = useState<Phase>('title')
  const [isHolding, setIsHolding] = useState(false)
  const holdRef = useRef(false)
  const keysRef = useRef(new Set<string>())

  const startRun = useCallback(() => {
    setPhase('running')
    setIsHolding(true)
    holdRef.current = true
  }, [])

  const returnToTitle = useCallback(() => {
    setPhase('title')
    setIsHolding(false)
    holdRef.current = false
    keysRef.current.clear()
  }, [])

  useEffect(() => {
    if (phase !== 'running') return

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(k)) {
        e.preventDefault()
        keysRef.current.add(k)
        setIsHolding(true)
        holdRef.current = true
      }
      if (k === 'escape') {
        returnToTitle()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      keysRef.current.delete(k)
      if (keysRef.current.size === 0) {
        setIsHolding(false)
        holdRef.current = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [phase, returnToTitle])

  const onPointerDown = useCallback(() => {
    if (phase === 'title') {
      startRun()
      return
    }
    setIsHolding(true)
    holdRef.current = true
  }, [phase, startRun])

  const onPointerUp = useCallback(() => {
    if (phase === 'running' && keysRef.current.size === 0) {
      setIsHolding(false)
      holdRef.current = false
    }
  }, [phase])

  return (
    <div
      className="relative h-dvh w-full select-none touch-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Sky + savanna background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2A1F12] via-[#3D2E1A] to-[#1A140C]" />

      {/* Distant hills */}
      <div
        className="absolute bottom-[28%] left-0 right-0 h-24 opacity-40"
        style={{
          background:
            'linear-gradient(to top, #5C4A32 0%, transparent 100%), radial-gradient(ellipse 80% 60% at 20% 100%, #6B5538 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 70% 100%, #5C4A32 0%, transparent 70%)',
        }}
      />

      {/* Scrolling ground */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[32%] ${phase === 'running' && isHolding ? 'ground-scroll' : ''}`}
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              #8B7355 0px,
              #8B7355 40px,
              #A08B6A 40px,
              #A08B6A 80px,
              #7A6548 80px,
              #7A6548 120px,
              #9A8560 120px,
              #9A8560 160px
            ),
            linear-gradient(to top, #6B5538 0%, #C4A35A 60%, #D4B86A 100%)
          `,
          backgroundSize: '400px 100%, 100% 100%',
        }}
      />

      {/* Ground edge highlight */}
      <div className="absolute bottom-[31.5%] left-0 right-0 h-1 bg-[#D4A017]/30" />

      {phase === 'title' ? (
        <TitleScreen onPlay={startRun} />
      ) : (
        <>
          <Cheetah isRunning={isHolding} />
          <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
            <p className="text-[#F5F0E6]/70 text-sm tracking-wide">
              Hold to sprint · Esc to menu
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              returnToTitle()
            }}
            className="absolute top-3 right-3 z-20 rounded-full border border-[#D4A017]/40 bg-[#1A140C]/80 px-3 py-1.5 text-xs text-[#F5F0E6] hover:border-[#D4A017]"
          >
            Menu
          </button>
        </>
      )}
    </div>
  )
}

function TitleScreen({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
      <div className="mb-2 text-[#D4A017] text-xs tracking-[0.35em] uppercase">
        Golden Hour
      </div>
      <h1
        className="text-center font-semibold leading-tight tracking-tight text-[#F5F0E6]"
        style={{ fontSize: 'clamp(2.25rem, 8vw, 3.75rem)' }}
      >
        Cheetah Speed
      </h1>
      <p className="mt-3 max-w-xs text-center text-sm text-[#F5F0E6]/70">
        You are the fastest land animal. Sprint the savanna.
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onPlay()
        }}
        className="mt-10 rounded-full bg-[#D4A017] px-10 py-3.5 text-base font-semibold tracking-wide text-[#1A140C] shadow-lg shadow-[#D4A017]/25 transition active:scale-95 hover:brightness-110"
      >
        Play
      </button>
      <p className="mt-6 text-xs text-[#F5F0E6]/45">
        Tap / hold or arrow keys · WASD
      </p>
    </div>
  )
}

function Cheetah({ isRunning }: { isRunning: boolean }) {
  return (
    <div
      className={`absolute bottom-[28%] left-[18%] z-10 ${isRunning ? 'cheetah-run' : ''}`}
      style={{ width: 120, height: 56 }}
      aria-hidden
    >
      {/* Body */}
      <svg
        viewBox="0 0 120 56"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tail */}
        <path
          d="M8 28 Q-4 18 2 10"
          stroke="#C4A035"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="2" cy="10" r="3" fill="#1A140C" />

        {/* Hind legs */}
        <g className={isRunning ? 'cheetah-leg' : ''} style={{ transformOrigin: '36px 40px' }}>
          <path d="M32 36 L28 52 L34 52" stroke="#B8902A" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g className={isRunning ? 'cheetah-leg' : ''} style={{ transformOrigin: '48px 40px' }}>
          <path d="M44 36 L48 52 L42 52" stroke="#A07A20" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Body torso */}
        <ellipse cx="58" cy="28" rx="36" ry="14" fill="#D4A017" />
        <ellipse cx="58" cy="26" rx="30" ry="10" fill="#E0B020" opacity="0.5" />

        {/* Spots */}
        <circle cx="42" cy="24" r="2.2" fill="#1A140C" opacity="0.55" />
        <circle cx="54" cy="22" r="1.8" fill="#1A140C" opacity="0.5" />
        <circle cx="66" cy="25" r="2" fill="#1A140C" opacity="0.55" />
        <circle cx="48" cy="30" r="1.6" fill="#1A140C" opacity="0.45" />
        <circle cx="62" cy="32" r="1.7" fill="#1A140C" opacity="0.5" />

        {/* Front legs */}
        <g className={isRunning ? 'cheetah-leg' : ''} style={{ transformOrigin: '78px 40px' }}>
          <path d="M74 34 L70 52 L76 52" stroke="#B8902A" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g className={isRunning ? 'cheetah-leg' : ''} style={{ transformOrigin: '88px 40px' }}>
          <path d="M86 34 L90 52 L84 52" stroke="#A07A20" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Neck + head */}
        <ellipse cx="92" cy="22" rx="12" ry="9" fill="#D4A017" />
        <ellipse cx="98" cy="18" rx="9" ry="7" fill="#E0B020" />
        {/* Ear */}
        <path d="M94 12 L96 4 L100 12" fill="#C49020" />
        {/* Eye */}
        <circle cx="102" cy="16" r="1.8" fill="#1A140C" />
        {/* Muzzle */}
        <ellipse cx="108" cy="20" rx="5" ry="3.5" fill="#E8C040" />
        <circle cx="111" cy="19" r="1.2" fill="#1A140C" />
      </svg>
    </div>
  )
}
