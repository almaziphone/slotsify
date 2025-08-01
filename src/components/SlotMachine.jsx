import { useState, useRef, useEffect } from 'react';
import '../styles/SlotMachine.css';
import { SYMBOLS_MAP, WIN_TABLE_DISPLAY, formatCombo } from './winTable.jsx';

// Constants - These could be moved to a separate config file
const REEL_SYMBOL_HEIGHT = 80; // px, adjust to match symbol height in slotreel.webp
const REEL_SYMBOLS_COUNT = 9; // adjust to match number of symbols in slotreel.webp
const REEL_COUNT = 3;
const REEL_STOP_DELAY = 400; // ms between each reel stop
const SPIN_SPEED = 24; // px per frame (adjust for speed)
const EXTRA_SPINS = 2; // Number of extra full spins before stopping

export default function SlotMachine({ coins, onSpin, spinLoading, spinResult, wheels }) {
  // State variables
  const [reelPositions, setReelPositions] = useState(() => wheels.map(n => getReelPosition(n)));
  const [spinningReels, setSpinningReels] = useState(Array(REEL_COUNT).fill(false));
  const [spinningOffsets, setSpinningOffsets] = useState(Array(REEL_COUNT).fill(0));
  const [showTransition, setShowTransition] = useState(Array(REEL_COUNT).fill(false));
  const [allReelsStopped, setAllReelsStopped] = useState(true);
  const prevWheels = useRef(wheels);
  const rafRef = useRef();

  // Helper function
  function getReelPosition(n) {
    // n is 1-based, so symbol 1 is at offset 0
    return -(n - 1) * REEL_SYMBOL_HEIGHT;
  }

  // Calculate the final offset for a reel, given its current offset and target symbol
  function calculateTargetOffset(currentOffset, targetSymbol) {
    const totalHeight = REEL_SYMBOL_HEIGHT * REEL_SYMBOLS_COUNT;
    let normalized = ((currentOffset % totalHeight) + totalHeight) % totalHeight;
    const targetOffset = getReelPosition(targetSymbol);
    let distance = (targetOffset - (-normalized)) - (EXTRA_SPINS * totalHeight);
    if (distance > 0) {
      distance -= totalHeight;
    }
    return currentOffset + distance;
  }

  // Animation using requestAnimationFrame
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

  // Start spinning when spinLoading is true
  useEffect(() => {
    if (spinLoading) {
      setSpinningReels(Array(REEL_COUNT).fill(true));
      setSpinningOffsets(Array(REEL_COUNT).fill(0));
      setShowTransition(Array(REEL_COUNT).fill(false));
      setAllReelsStopped(false);
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
            if (updated.every(r => !r)) {
              setAllReelsStopped(true);
            }
            return updated;
          });
          setTimeout(() => {
            setShowTransition(trans => {
              const updated = [...trans];
              updated[i] = true;
              return updated;
            });
            setSpinningOffsets(offsets => {
              const updated = [...offsets];
              updated[i] = calculateTargetOffset(offsets[i], n);
              return updated;
            });
            setTimeout(() => {
              setShowTransition(trans => {
                const updated = [...trans];
                updated[i] = false;
                return updated;
              });
              setReelPositions(pos => {
                const updated = [...pos];
                updated[i] = getReelPosition(n);
                return updated;
              });
              setSpinningOffsets(offsets => {
                const updated = [...offsets];
                updated[i] = 0;
                return updated;
              });
            }, 20);
          }, 20);
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
    <div className="slot-machine">
      <p className="coins-label">
        Coins: <span className="coins-value">{coins}</span>
      </p>
      <div className="slot-wheels">
        {wheels.map((n, i) => {
          const isSpinning = spinningReels[i];
          const bgPos = `0px ${-spinningOffsets[i] + (isSpinning ? 0 : (reelPositions[i] ?? 0)) - REEL_SYMBOL_HEIGHT / 2}px`;

          return (
            <div
              key={i}
              className={`slot-reel${isSpinning ? ' spinning' : ''}`}
              style={{
                backgroundImage: 'url(/images/slotreel.webp)',
                backgroundPosition: bgPos,
                transition: isSpinning || !showTransition[i]
                  ? 'none'
                  : 'background-position 0.3s cubic-bezier(0.40, -0.01, 0.60, 1.20)',
                height: REEL_SYMBOL_HEIGHT * 2,
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
        disabled={spinLoading || coins < 10 || !allReelsStopped}
      >
        {spinLoading || !allReelsStopped ? 'Spinning...' : 'Spin (10 coins)'}
      </button>
      {(!spinResult || !allReelsStopped) ? (<div><p className='result-win empty'>&nbsp;</p></div>) : (
        <div className="spin-result">
          <p className={spinResult.win ? 'result-win' : 'result-lose'}>
            {spinResult.win
              ? `🎉 You won ${spinResult.payout} coins!`
              : 'No win this time.'}
          </p>
        </div>
      )}
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
  );
};