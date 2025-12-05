import React, { useEffect, useState } from 'react';

interface ParticleOverlayProps {
  country: string;
}

const ParticleOverlay: React.FC<ParticleOverlayProps> = ({ country }) => {
  const [effectType, setEffectType] = useState<'sakura' | 'snow' | 'sparkle' | null>(null);

  useEffect(() => {
    const c = country.toLowerCase();
    if (c.includes('japan') || c.includes('korea') || c.includes('china')) {
      setEffectType('sakura');
    } else if (c.includes('switzerland') || c.includes('canada') || c.includes('norway') || c.includes('iceland') || c.includes('finland') || c.includes('russia')) {
      setEffectType('snow');
    } else {
      setEffectType('sparkle');
    }
  }, [country]);

  if (!effectType) return null;

  // Increased particle count from 20 to 50 for denser effect
  const particles = Array.from({ length: 50 }); 

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => (
        <div
          key={i}
          className={`particle-${effectType}`}
          style={{
            left: `${Math.random() * 100}vw`,
            animationDuration: `${5 + Math.random() * 8}s`, // Varied speed
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.7 + 0.3
          }}
        />
      ))}
    </div>
  );
};

export default ParticleOverlay;