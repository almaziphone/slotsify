import { useState, useRef, useEffect } from 'react'
import '../styles/SlotMachine.css'
import { SYMBOLS_MAP, WIN_TABLE_DISPLAY, formatCombo } from './winTable.jsx'

const REEL_SYMBOL_HEIGHT = 80; // px, adjust to match symbol height in slotreel.webp
const REEL_SYMBOLS_COUNT = 9; // adjust to match number of symbols in slotreel.webp
const REEL_COUNT = 3;
const REEL_STOP_DELAY = 400; // ms between each reel stop
const SPIN_SPEED = 24; // px per frame (adjust for speed)

export default function SlotMachine({ coins, onSpin, spinLoading, spinResult, wheels }) {
  const [reelPositions, setReelPositions] = useState(() => wheels.map(n => getReelPosition(n)));
  const [spinningReels, setSpinningReels] = useState([false, false, false]);
  const [spinningOffsets, setSpinningOffsets] = useState([0, 0, 0]);
  const [showTransition, setShowTransition] = useState([false, false, false]);
  const prevWheels = useRef(wheels);
  const rafRef = useRef();

  function getReelPosition(n) {
    return -(n - 1) * REEL_SYMBOL_HEIGHT;
  }

  // Animate spinning reels with requestAnimationFrame
  useEffect(() => {
    let running = true;
    function animate() {
      setSpinningOffsets(offsets =>
        offsets.map((offset, i) =>
          spinningReels[i]
            ? (offset + SPIN_SPEED) % (REEL_SYMBOL_HEIGHT * REEL_SYMBOLS_COUNT)
            : offset
        )
      );
      if (spinningReels.some(Boolean) && running) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }
    if (spinningReels.some(Boolean)) {
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spinningReels]);

  // Start spinning all reels when spinLoading starts
  useEffect(() => {
    if (spinLoading) {
      setSpinningReels([true, true, true]);
      setSpinningOffsets([0, 0, 0]);
      setShowTransition([false, false, false]);
    }
  }, [spinLoading]);

  // Staggered stop for each reel
  useEffect(() => {
    if (!spinLoading && prevWheels.current !== wheels) {
      wheels.forEach((n, i) => {
        setTimeout(() => {
          setSpinningReels(reels => {
            const updated = [...reels];
            updated[i] = false;
            return updated;
          });
          // Wait a tick before showing transition for smooth effect
          setTimeout(() => {
            setShowTransition(trans => {
              const updated = [...trans];
              updated[i] = true;
              return updated;
            });
            setReelPositions(pos => {
              const updated = [...pos];
              updated[i] = getReelPosition(n);
              return updated;
            });
          }, 20); // 20ms delay to ensure transition is applied after offset
        }, i * REEL_STOP_DELAY);
      });
      prevWheels.current = wheels;
    }
  }, [wheels, spinLoading]);

  // Ensure reelPositions always matches wheels
  useEffect(() => {
    setReelPositions(wheels.map(n => getReelPosition(n)));
  }, [wheels.length]);

  return (
    <div>
      <p className="coins-label">
        Coins: <span className="coins-value">{coins}</span>
      </p>
      {/* Slot machine wheels */}
      <div className="slot-wheels">
        {wheels.map((n, i) => {
          const isSpinning = spinningReels[i];
          const bgPos = isSpinning
            ? `0px ${-spinningOffsets[i]}px`
            : `0px ${reelPositions[i] ?? 0}px`;
          return (
            <div
              className={`slot-reel${isSpinning ? ' spinning' : ''}`}
              key={i}
              style={{
                backgroundImage: 'url(/images/slotreel.webp)',
                backgroundPosition: bgPos,
                transition: isSpinning || !showTransition[i]
                  ? 'none'
                  : 'background-position 0.7s cubic-bezier(0.40, -0.01, 0.60, 1.20)',
                height: REEL_SYMBOL_HEIGHT * 3,
                width: 80,
                overflow: 'hidden',
              }}
            />
          );
        })}
      </div>
      <button
        className="spin-btn"
        onClick={onSpin}
        disabled={spinLoading || coins < 10}
      >
        {spinLoading ? 'Spinning...' : 'Spin (10 coins)'}
      </button>
      {spinResult && (
        <div className="spin-result">
          <p className={spinResult.win ? 'result-win' : 'result-lose'}>
            {spinResult.win
              ? `🎉 You won ${spinResult.payout} coins!`
              : 'No win this time.'}
          </p>
        </div>
      )}
      {/* Winner table */}
      <h3 className="winner-table-title">Winner Table</h3>
      <table className="winner-table">
        <thead>
          <tr>
            <th>Combo</th>
            <th>Payout</th>
          </tr>
        </thead>
        <tbody>
          {WIN_TABLE_DISPLAY.map(row => (
            <tr key={row.combo.join('-')}>
              <td>{formatCombo(row.combo)}</td>
              <td>{row.payout}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}