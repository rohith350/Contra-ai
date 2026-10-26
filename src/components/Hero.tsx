import heroImg from '../assets/hero.png'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'

interface HeroProps {
  count: number
  onIncrement: () => void
}

export function Hero({ count, onIncrement }: HeroProps) {
  return (
    <section id="center">
      <div className="hero">
        <img src={heroImg} className="base" width="170" height="179" alt="" />
        <img src={reactLogo} className="framework" alt="React logo" />
        <img src={viteLogo} className="vite" alt="Vite logo" />
      </div>
      <div>
        <h1>Get started</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
        </p>
      </div>
      <button
        type="button"
        className="counter"
        onClick={onIncrement}
      >
        Count is {count}
      </button>
    </section>
  )
}
