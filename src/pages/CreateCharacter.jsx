import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getGroqKey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Groq from 'groq-sdk';

const PERSONALITY_TYPES = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and supportive' },
  { value: 'sarcastic', label: 'Sarcastic', description: 'Witty and sharp' },
  { value: 'wise', label: 'Wise', description: 'Thoughtful and philosophical' },
  { value: 'mysterious', label: 'Mysterious', description: 'Enigmatic and secretive' },
  { value: 'cheerful', label: 'Cheerful', description: 'Bubbly and enthusiastic' },
  { value: 'serious', label: 'Serious', description: 'Professional and focused' },
  { value: 'romantic', label: 'Romantic', description: 'Passionate and affectionate' },
  { value: 'adventurous', label: 'Adventurous', description: 'Bold and daring' },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];

export default function CreateCharacter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    personality: 'friendly',
    backstory: '',
    age: '',
    gender: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [generatingBackstory, setGeneratingBackstory] = useState(false);

  useEffect(() => {
    checkCharacterLimit();
  }, [user]);

  const checkCharacterLimit = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      if (error) throw error;

      setCharacterCount(data.length);
      
      if (data.length >= 2) {
        setErrors({ limit: 'You have reached the maximum limit of 2 characters. Please delete a character to create a new one.' });
      }
    } catch (error) {
      console.error('Error checking character limit:', error);
    } finally {
      setCheckingLimit(false);
    }
  };

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
        setErrors((prev) => ({ ...prev, image: 'Please upload a valid image file' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image must be less than 5MB' }));
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, image: '' }));
    }
  };

  const generateBackstory = async () => {
    if (!formData.name || !formData.personality) {
      setErrors((prev) => ({ 
        ...prev, 
        backstory: 'Please enter a character name and select a personality first' 
      }));
      return;
    }

    setGeneratingBackstory(true);
    setErrors((prev) => ({ ...prev, backstory: '' }));

    try {
      const { apiKey, error: keyError } = await getGroqKey();
      
      if (keyError || !apiKey) {
        throw new Error('Failed to get API key');
      }

      const groq = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      const personalityDesc = PERSONALITY_TYPES.find(p => p.value === formData.personality)?.description || formData.personality;
      const ageInfo = formData.age ? ` who is ${formData.age} years old` : '';
      const genderInfo = formData.gender ? ` (${formData.gender})` : '';

      const prompt = `Create a detailed and engaging backstory (150-200 words) for a roleplaying character named ${formData.name}${ageInfo}${genderInfo}. The character has a ${formData.personality} personality (${personalityDesc}). 

Make the backstory:
- Rich in detail and emotional depth
- Include their past experiences and what shaped them
- Mention their motivations and desires
- Make them feel like a real person with dreams and struggles
- Write in third person
- Do not use markdown formatting

Write the backstory now:`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a creative writer specializing in character development. Write engaging, detailed backstories for roleplaying characters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_tokens: 500,
      });

      const generatedBackstory = completion.choices[0]?.message?.content?.trim();
      
      if (generatedBackstory) {
        setFormData(prev => ({ ...prev, backstory: generatedBackstory }));
      } else {
        throw new Error('No backstory generated');
      }
    } catch (error) {
      console.error('Error generating backstory:', error);
      setErrors((prev) => ({ 
        ...prev, 
        backstory: 'Failed to generate backstory. Please try again or write one manually.' 
      }));
    } finally {
      setGeneratingBackstory(false);
    }
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
    } else if (formData.backstory.trim().length < 50) {
      newErrors.backstory = 'Backstory must be at least 50 characters';
    }

    if (formData.age && (isNaN(formData.age) || formData.age < 0 || formData.age > 10000)) {
      newErrors.age = 'Please enter a valid age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (characterCount >= 2) {
      setErrors({ limit: 'You have reached the maximum limit of 2 characters. Please delete a character to create a new one.' });
      return;
    }
    
    if (!validate()) return;

    setLoading(true);

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile && imagePreview) {
        imageUrl = imagePreview;
      }

      const { data, error } = await supabase
        .from('characters')
        .insert([
          {
            user_id: user.id,
            name: formData.name.trim(),
            personality: formData.personality,
            backstory: formData.backstory.trim(),
            age: formData.age ? parseInt(formData.age) : null,
            gender: formData.gender || null,
            image_url: imageUrl,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating character:', error);
      setErrors({ submit: 'Failed to create character. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingLimit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mb-4"></div>
          <p className="text-white/60">Checking character limit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-pure-white mb-2">
          Create New <span className="text-neon-green">Character</span>
        </h1>
        <p className="text-white/50 text-sm sm:text-base max-w-2xl mx-auto">
          Design a unique character with personality and depth
        </p>
        <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-dark-gray/50 border border-white/10 rounded-lg">
          <span className="text-white/50 text-xs sm:text-sm">Characters:</span>
          <span className={`font-bold text-xs sm:text-sm ${characterCount >= 2 ? 'text-red-400' : 'text-neon-green'}`}>
            {characterCount}/2
          </span>
        </div>
      </div>

      {errors.limit && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold text-red-400 mb-1">Character Limit Reached</h3>
              <p className="text-red-300/90 text-sm">{errors.limit}</p>
              <button
                type="button"
                onClick={() => navigate('/characters')}
                className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
              >
                Go to My Characters →
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Character Image */}
        <div className="card border-white/20">
          <label className="block text-xs sm:text-sm font-bold text-pure-white mb-3 uppercase tracking-wider">
            Character Image
          </label>
          
          <div className="flex flex-col items-center gap-4">
            {imagePreview ? (
              <div className="relative">
                <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-neon-green shadow-lg shadow-neon-green/50">
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
                    setImageFile(null);
                  }}
                  className="absolute top-2 right-2 bg-neon-pink text-pure-black p-2 rounded-lg hover:bg-neon-pink/80 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="w-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-white/20 hover:border-neon-green rounded-lg p-12 text-center transition-all duration-300 hover:bg-neon-green/5">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-pure-white font-medium mb-2">Click to upload image</p>
                  <p className="text-sm text-white/60">PNG, JPG, GIF up to 5MB</p>
                </div>
              </label>
            )}
            
            {!imagePreview && (
              <div className="w-full">
                <p className="text-sm text-white/60 mb-2 text-center">Or paste image URL:</p>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}
            
            {errors.image && (
              <p className="text-sm text-neon-pink font-medium">{errors.image}</p>
            )}
          </div>
        </div>

        {/* Character Name */}
        <div className="card border-white/20">
          <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-pure-white mb-2 uppercase tracking-wider">
            Character Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`input-field text-sm sm:text-base ${errors.name ? 'border-neon-pink shadow-lg shadow-neon-pink/50' : ''}`}
            placeholder="e.g., Elena Blackwood"
          />
          {errors.name && (
            <p className="mt-2 text-xs sm:text-sm text-neon-pink font-medium">{errors.name}</p>
          )}
        </div>

        {/* Age and Gender */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="card border-white/20">
            <label htmlFor="age" className="block text-xs sm:text-sm font-bold text-pure-white mb-2 uppercase tracking-wider">
              Age (Optional)
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className={`input-field text-sm sm:text-base ${errors.age ? 'border-neon-pink shadow-lg shadow-neon-pink/50' : ''}`}
              placeholder="e.g., 25"
              min="0"
            />
            {errors.age && (
              <p className="mt-2 text-xs sm:text-sm text-neon-pink font-medium">{errors.age}</p>
            )}
          </div>

          <div className="card border-white/20">
            <label htmlFor="gender" className="block text-xs sm:text-sm font-bold text-pure-white mb-2 uppercase tracking-wider">
              Gender (Optional)
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input-field text-sm sm:text-base"
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Personality */}
        <div className="card border-white/20">
          <label className="block text-xs sm:text-sm font-bold text-pure-white mb-3 uppercase tracking-wider">
            Personality Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {PERSONALITY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, personality: type.value }))}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                  formData.personality === type.value
                    ? 'border-neon-green bg-neon-green/10 shadow-lg shadow-neon-green/50'
                    : 'border-white/10 bg-dark-gray hover:border-white/30'
                }`}
              >
                <p className="font-bold text-pure-white text-sm sm:text-base mb-0.5 sm:mb-1">{type.label}</p>
                <p className="text-[10px] sm:text-xs text-white/60">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Backstory */}
        <div className="card border-white/20 relative">
          <div className="flex items-start justify-between gap-3 mb-2">
            <label htmlFor="backstory" className="block text-xs sm:text-sm font-bold text-pure-white uppercase tracking-wider">
              Backstory *
            </label>
            <button
              type="button"
              onClick={generateBackstory}
              disabled={generatingBackstory}
              className="group relative flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 hover:from-neon-cyan/20 hover:to-neon-purple/20 border border-neon-cyan/30 hover:border-neon-cyan/50 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate AI backstory"
            >
              {generatingBackstory ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-neon-cyan" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs font-semibold text-neon-cyan">Generating...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">✨</span>
                  <span className="text-xs font-semibold text-neon-cyan">AI Generate</span>
                </>
              )}
              
              {/* Tooltip */}
              {!generatingBackstory && (
                <div className="absolute right-0 top-full mt-2 w-48 px-3 py-2 bg-dark-gray border border-neon-cyan/30 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10 shadow-lg shadow-neon-cyan/20">
                  <p className="text-xs text-white/80 leading-relaxed">
                    Save time! Let AI create a detailed backstory based on your character's info
                  </p>
                </div>
              )}
            </button>
          </div>
          <textarea
            id="backstory"
            name="backstory"
            value={formData.backstory}
            onChange={handleChange}
            rows={7}
            className={`input-field resize-none text-sm sm:text-base leading-relaxed ${errors.backstory ? 'border-neon-pink shadow-lg shadow-neon-pink/50' : ''}`}
            placeholder="Write a detailed backstory for your character... Who are they? What's their history? What motivates them?"
          />
          {errors.backstory && (
            <p className="mt-2 text-xs sm:text-sm text-neon-pink font-medium">{errors.backstory}</p>
          )}
          <p className="mt-2 text-[10px] sm:text-xs text-white/40 font-mono">
            {formData.backstory.length} / 50 minimum characters
          </p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="card border-neon-pink/50 bg-neon-pink/10">
            <p className="text-xs sm:text-sm text-neon-pink font-medium">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-outline sm:w-auto"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary sm:w-auto"
            disabled={loading || characterCount >= 2}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Create Character</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
