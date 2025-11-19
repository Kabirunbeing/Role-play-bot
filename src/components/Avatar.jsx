export default function Avatar({ character, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-8 h-8 text-sm',
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
    xl: 'w-32 h-32 text-6xl',
  };

  const sizeClass = sizes[size] || sizes.md;

  if (character.customImage) {
    return (
      <div className={`${sizeClass} rounded-lg overflow-hidden bg-dark-gray flex-shrink-0 ${className}`}>
        <img 
          src={character.customImage} 
          alt={character.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Use initial-based avatar with color
  const avatarColor = character.avatarColor || '#00ff41';
  const avatarLetter = character.avatar || character.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div 
      className={`${sizeClass} rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{ backgroundColor: avatarColor + '30', color: avatarColor, border: `2px solid ${avatarColor}` }}
    >
      {avatarLetter}
    </div>
  );
}
