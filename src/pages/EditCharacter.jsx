import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

const PERSONALITY_TYPES = [
  { value: 'friendly', label: 'Friendly', icon: 'F', description: 'Warm, kind, and supportive', color: 'neon-green' },
  { value: 'sarcastic', label: 'Sarcastic', icon: 'S', description: 'Witty with a sharp tongue', color: 'neon-yellow' },
  { value: 'wise', label: 'Wise', icon: 'W', description: 'Thoughtful and philosophical', color: 'neon-cyan' },
  { value: 'dark', label: 'Dark', icon: 'D', description: 'Mysterious and brooding', color: 'neon-purple' },
  { value: 'cheerful', label: 'Cheerful', icon: 'C', description: 'Bubbly and enthusiastic', color: 'neon-pink' },
];

const AVATAR_COLORS = [
  '#00ff41', '#00f0ff', '#ffff00', '#ff006e', '#b026ff', 
  '#0066ff', '#84cc16', '#14b8a6', '#fbbf24', '#fb7185',
  '#6366f1', '#8b5cf6'
];

export default function EditCharacter() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const characters = useStore((state) => state.characters);
  const updateCharacter = useStore((state) => state.updateCharacter);

  const character = characters.find((c) => c.id === characterId);

  const [formData, setFormData] = useState({
    name: '',
    personality: 'friendly',
    backstory: '',
    avatar: 'A',
    avatarColor: AVATAR_COLORS[0],
    customImage: null,
  });

  const [errors, setErrors] = useState({});
  const [avatarType, setAvatarType] = useState('initial');
  const [imagePreview, setImagePreview] = useState(null);

  const avatarLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Load character data
  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name,
        personality: character.personality,
        backstory: character.backstory,
        avatar: character.avatar || character.name?.charAt(0)?.toUpperCase() || 'A',
        avatarColor: character.avatarColor || AVATAR_COLORS[0],
        customImage: character.customImage || null,
      });
      
      if (character.customImage) {
        setAvatarType('custom');
        setImagePreview(character.customImage);
      } else {
        setAvatarType('initial');
      }
    }
  }, [character]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, avatar: 'Please upload a valid image file' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, avatar: 'Image must be less than 5MB' }));
        return;
      }

      setErrors((prev) => ({ ...prev, avatar: '' }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({ ...prev, customImage: reader.result, avatar: 'IMG' }));
      };
      reader.readAsDataURL(file);
      setAvatarType('custom');
    }
  };

  const handleAvatarTypeChange = (type) => {
    setAvatarType(type);
    if (type === 'initial') {
      setImagePreview(null);
      setFormData((prev) => ({ ...prev, customImage: null, avatar: character.avatar || 'A' }));
    }
    setErrors((prev) => ({ ...prev, avatar: '' }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Character name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.backstory.trim()) {
      newErrors.backstory = 'Backstory is required';
    } else if (formData.backstory.trim().length < 10) {
      newErrors.backstory = 'Backstory must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    updateCharacter(characterId, formData);
    navigate(`/chat/${characterId}`);
  };

  if (!character) {
    return (
      <div className="text-center py-20 fade-in">
        <div className="text-6xl sm:text-8xl mb-6 text-neon-pink font-bold">404</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-pure-white mb-3">Character Not Found</h2>
        <p className="text-white/60 mb-8 text-base sm:text-lg">This character doesn't exist or has been deleted.</p>
        <Link to="/characters" className="btn-primary">
          View All Characters
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-pure-white mb-3">
          Edit <span className="text-neon-cyan">{character.name}</span>
        </h1>
        <p className="text-white/60 text-sm sm:text-base md:text-lg">
          Update your character's personality and backstory
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Avatar Selection */}
        <div className="card border-white/20 slide-up">
          <label className="block text-xs sm:text-sm font-bold text-pure-white mb-3 sm:mb-4 uppercase tracking-wider">
            Choose Avatar
          </label>
          
          {/* Avatar Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleAvatarTypeChange('initial')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                avatarType === 'initial'
                  ? 'bg-neon-cyan text-pure-black font-bold'
                  : 'bg-dark-gray text-white/60 hover:text-pure-white border border-white/10'
              }`}
            >
              Initial
            </button>
            <button
              type="button"
              onClick={() => handleAvatarTypeChange('custom')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                avatarType === 'custom'
                  ? 'bg-neon-cyan text-pure-black font-bold'
                  : 'bg-dark-gray text-white/60 hover:text-pure-white border border-white/10'
              }`}
            >
              Upload Image
            </button>
          </div>

          {/* Initial Selection */}
          {avatarType === 'initial' && (
            <div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-4">
                {avatarLetters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatar: letter, customImage: null }))}
                    className={`text-xl sm:text-2xl font-bold p-3 rounded-lg transition-all duration-300 ${
                      formData.avatar === letter && !formData.customImage
                        ? 'bg-neon-cyan/20 ring-2 ring-neon-cyan scale-110 shadow-lg text-neon-cyan'
                        : 'bg-dark-gray hover:bg-mid-gray border border-white/10 text-white/60'
                    }`}
                    style={{ backgroundColor: formData.avatar === letter ? formData.avatarColor + '20' : undefined }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              
              {/* Color Picker */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-pure-white mb-2 uppercase tracking-wider">
                  Avatar Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, avatarColor: color }))}
                      className={`w-full h-10 rounded-lg transition-all duration-300 ${
                        formData.avatarColor === color
                          ? 'ring-2 ring-pure-white scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custom Image Upload */}
          {avatarType === 'custom' && (
            <div className="space-y-4">
              {imagePreview ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border-2 border-neon-cyan shadow-lg">
                    <img 
                      src={imagePreview} 
                      alt="Character preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData((prev) => ({ ...prev, customImage: null, avatar: character.avatar }));
                    }}
                    className="btn-outline text-sm"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-white/20 hover:border-neon-cyan rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 hover:bg-neon-cyan/5">
                    <svg className="w-16 h-16 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-pure-white font-medium mb-2">Click to upload image</p>
                    <p className="text-xs sm:text-sm text-white/60">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </label>
              )}
              {errors.avatar && (
                <p className="text-xs sm:text-sm text-neon-pink font-medium text-center">{errors.avatar}</p>
              )}
            </div>
          )}
        </div>

        {/* Character Name */}
        <div className="card border-white/20 slide-up" style={{ animationDelay: '0.1s' }}>
          <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-pure-white mb-2 sm:mb-3 uppercase tracking-wider">
            Character Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`input-field ${errors.name ? 'border-neon-pink shadow-neon-pink' : ''}`}
            placeholder="e.g., Aria Shadowblade"
          />
          {errors.name && (
            <p className="mt-2 text-xs sm:text-sm text-neon-pink font-medium">{errors.name}</p>
          )}
        </div>

        {/* Personality Type */}
        <div className="card border-white/20 slide-up" style={{ animationDelay: '0.2s' }}>
          <label className="block text-xs sm:text-sm font-bold text-pure-white mb-3 sm:mb-4 uppercase tracking-wider">
            Personality Type *
          </label>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {PERSONALITY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, personality: type.value }))}
                className={`p-4 sm:p-5 rounded-lg border-2 transition-all duration-300 text-left ${
                  formData.personality === type.value
                    ? `border-${type.color} bg-${type.color}/10 shadow-lg`
                    : 'border-white/10 bg-dark-gray hover:border-white/30'
                }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className={`text-2xl sm:text-3xl font-bold flex-shrink-0 text-${type.color}`}>{type.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-pure-white text-base sm:text-lg truncate">{type.label}</p>
                    <p className="text-xs text-white/60 truncate">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Backstory */}
        <div className="card border-white/20 slide-up" style={{ animationDelay: '0.3s' }}>
          <label htmlFor="backstory" className="block text-xs sm:text-sm font-bold text-pure-white mb-2 sm:mb-3 uppercase tracking-wider">
            Backstory *
          </label>
          <textarea
            id="backstory"
            name="backstory"
            value={formData.backstory}
            onChange={handleChange}
            rows={6}
            className={`input-field resize-none ${errors.backstory ? 'border-neon-pink shadow-neon-pink' : ''}`}
            placeholder="Write a compelling backstory for your character... Who are they? What's their history? What motivates them?"
          />
          {errors.backstory && (
            <p className="mt-2 text-xs sm:text-sm text-neon-pink font-medium">{errors.backstory}</p>
          )}
          <p className="mt-2 text-xs text-white/40 font-mono">
            {formData.backstory.length} characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 pt-4 slide-up" style={{ animationDelay: '0.4s' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-outline w-full sm:w-auto"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary w-full sm:w-auto">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
