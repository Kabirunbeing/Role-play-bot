import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, getGroqKey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Groq from 'groq-sdk';
import { CHARACTER_TEMPLATES } from '../lib/characterTemplates';

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
  const { characterId } = useParams();
  const isEditMode = Boolean(characterId);

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
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadCharacter();
      setCheckingLimit(false);
    } else {
      checkCharacterLimit();
    }
  }, [user, characterId]);

  const loadCharacter = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || '',
          personality: data.personality || 'friendly',
          backstory: data.backstory || '',
          age: data.age ? String(data.age) : '',
          gender: data.gender || '',
          imageUrl: data.image_url || '',
        });

        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      } else {
        setErrors({ load: 'Character not found' });
      }
    } catch (error) {
      console.error('Error loading character:', error);
      setErrors({ load: 'Failed to load character' });
    }
  };

  const checkCharacterLimit = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      if (error) throw error;

      setCharacterCount(data.length);

      if (data.length >= 5) {
        setErrors({ limit: 'You have reached the maximum limit of 5 characters. Please delete a character to create a new one.' });
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

  const handleTemplateSelect = (template) => {
    setFormData({
      name: template.name,
      personality: template.personality,
      backstory: template.backstory,
      age: template.age,
      gender: template.gender,
      imageUrl: template.imageUrl,
    });

    if (template.imageUrl) {
      setImagePreview(template.imageUrl);
      setImageFile(null);
    }

    setShowTemplates(false);
    setErrors({});
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

    if (!isEditMode && characterCount >= 5) {
      setErrors({ limit: 'You have reached the maximum limit of 5 characters. Please delete a character to create a new one.' });
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile && imagePreview) {
        imageUrl = imagePreview;
      }

      if (isEditMode) {
        // Update existing character
        const { data, error } = await supabase
          .from('characters')
          .update({
            name: formData.name.trim(),
            personality: formData.personality,
            backstory: formData.backstory.trim(),
            age: formData.age ? parseInt(formData.age) : null,
            gender: formData.gender || null,
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', characterId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        navigate(`/chat/${data.id}`);
      } else {
        // Create new character
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
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} character:`, error);
      setErrors({ submit: `Failed to ${isEditMode ? 'update' : 'create'} character. Please try again.` });
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
    <div className="max-w-7xl mx-auto px-4 py-6 fade-in">
      {/* Header Section */}
      <div className="mb-8 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-pure-white mb-3 sm:mb-4 tracking-tight">
          {isEditMode ? (
            <>
              Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-blue">Character</span>
            </>
          ) : (
            <>
              Create New <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-cyan to-neon-blue">Character</span>
            </>
          )}
        </h1>
        <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {isEditMode ? 'Update your character details and bring them to life' : 'Design a unique character with personality and depth'}
        </p>
        {!isEditMode && (
          <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-dark-gray to-dark-gray/50 border border-white/10 rounded-full backdrop-blur-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-white/60 text-xs sm:text-sm md:text-base font-medium">Characters</span>
            </div>
            <div className="h-6 w-px bg-white/10"></div>
            <span className={`font-bold text-sm sm:text-base md:text-lg ${characterCount >= 5 ? 'text-red-400' : 'text-neon-green'}`}>
              {characterCount} / 5
            </span>
          </div>
        )}
      </div>

      {!isEditMode && (
        <div className="mb-10 flex justify-center">
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-neon-purple/20 via-neon-pink/20 to-neon-purple/20 border-2 border-neon-purple/40 hover:border-neon-purple rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-neon-purple/30 hover:scale-105"
          >
            <span className="text-xl sm:text-2xl">✨</span>
            <div className="text-left">
              <p className="text-sm sm:text-base font-bold text-pure-white group-hover:text-neon-purple transition-colors">
                Choose a Template
              </p>
              <p className="text-[10px] sm:text-xs text-white/50">
                Start with a pre-made character
              </p>
            </div>
            <svg className="w-5 h-5 text-neon-purple opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-gray border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div>
                <h2 className="text-2xl font-display font-bold text-pure-white">Select a Template</h2>
                <p className="text-white/50 text-sm">Choose a character to start your journey</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHARACTER_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-neon-green/50 hover:shadow-lg hover:shadow-neon-green/10 transition-all duration-300 text-left group"
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black/50 border border-white/10">
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-pure-white truncate group-hover:text-neon-green transition-colors">
                        {template.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {template.personality}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mb-2">
                      {template.gender} • {template.age} years
                    </p>
                    <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
                      {template.backstory}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {errors.load && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold text-red-400 mb-1">Error Loading Character</h3>
              <p className="text-red-300/90 text-sm">{errors.load}</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Grid Container - Two Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* LEFT COLUMN - Character Visuals & Basic Info */}
          <div className="space-y-6">

            {/* Character Image */}
            <div className="card border-neon-green/20 hover:border-neon-green/40 transition-all duration-300">
              <label className="block text-xs sm:text-sm font-bold text-pure-white mb-3 sm:mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Character Image
              </label>

              <div className="flex flex-col items-center gap-4">
                {imagePreview ? (
                  <div className="relative group">
                    <div className="w-64 h-64 rounded-2xl overflow-hidden border-4 border-neon-green/50 shadow-2xl shadow-neon-green/30 ring-4 ring-neon-green/10">
                      <img
                        src={imagePreview}
                        alt="Character preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute -top-3 -right-3 bg-neon-pink text-pure-black p-3 rounded-full hover:bg-neon-pink/90 transition-all shadow-lg hover:scale-110 duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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
                    <div className="border-2 border-dashed border-white/20 hover:border-neon-green/50 rounded-2xl p-16 text-center transition-all duration-300 hover:bg-neon-green/5 group">
                      <svg className="w-20 h-20 mx-auto mb-4 text-white/40 group-hover:text-neon-green/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-pure-white font-bold text-base sm:text-lg mb-2 group-hover:text-neon-green transition-colors">Click to upload image</p>
                      <p className="text-sm text-white/50">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </label>
                )}

                {!imagePreview && (
                  <div className="w-full">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-pure-black text-white/40 uppercase tracking-wider font-semibold">Or</span>
                      </div>
                    </div>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      className="input-field mt-4 text-center"
                      placeholder="Paste image URL here..."
                    />
                  </div>
                )}

                {errors.image && (
                  <div className="w-full p-3 bg-neon-pink/10 border border-neon-pink/30 rounded-lg">
                    <p className="text-sm text-neon-pink font-medium text-center">{errors.image}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Character Name */}
            <div className="card border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300">
              <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-pure-white mb-2 sm:mb-3 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Character Name
                <span className="text-neon-pink text-lg">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field text-base sm:text-lg font-medium ${errors.name ? 'border-neon-pink/50 shadow-lg shadow-neon-pink/30 ring-2 ring-neon-pink/20' : 'focus:border-neon-cyan/50'}`}
                placeholder="e.g., Elena Blackwood"
              />
              {errors.name && (
                <p className="mt-3 text-sm text-neon-pink font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card border-white/10 hover:border-white/20 transition-all duration-300">
                <label htmlFor="age" className="block text-xs sm:text-sm font-bold text-pure-white mb-2 sm:mb-3 uppercase tracking-wider">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`input-field ${errors.age ? 'border-neon-pink/50 shadow-lg shadow-neon-pink/30' : ''}`}
                  placeholder="25"
                  min="0"
                />
                {errors.age && (
                  <p className="mt-2 text-xs text-neon-pink font-medium">{errors.age}</p>
                )}
              </div>

              <div className="card border-white/10 hover:border-white/20 transition-all duration-300">
                <label htmlFor="gender" className="block text-xs sm:text-sm font-bold text-pure-white mb-2 sm:mb-3 uppercase tracking-wider">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Personality & Backstory */}
          <div className="space-y-6">

            {/* Personality */}
            <div className="card border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300">
              <label className="block text-sm sm:text-base font-bold text-pure-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Personality Type
                <span className="text-neon-pink text-lg">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PERSONALITY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, personality: type.value }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group ${formData.personality === type.value
                      ? 'border-neon-purple bg-neon-purple/20 shadow-lg shadow-neon-purple/30 scale-105'
                      : 'border-white/10 bg-dark-gray/50 hover:border-neon-purple/30 hover:bg-dark-gray/80'
                      }`}
                  >
                    <p className={`font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 ${formData.personality === type.value ? 'text-neon-purple' : 'text-pure-white'}`}>
                      {type.label}
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/50">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Backstory */}
            <div className="card border-neon-yellow/20 hover:border-neon-yellow/40 transition-all duration-300">
              <div className="flex items-center justify-between gap-3 mb-4">
                <label htmlFor="backstory" className="block text-xs sm:text-sm font-bold text-pure-white uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-5 h-5 text-neon-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Backstory
                  <span className="text-neon-pink text-base sm:text-lg">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateBackstory}
                  disabled={generatingBackstory}
                  className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 hover:from-neon-cyan/30 hover:to-neon-purple/30 border-2 border-neon-cyan/40 hover:border-neon-cyan/60 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg hover:shadow-neon-cyan/30"
                  title="Generate AI backstory"
                >
                  {generatingBackstory ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-neon-cyan" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs font-bold text-neon-cyan">Generating...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✨</span>
                      <span className="text-[10px] sm:text-xs font-bold text-pure-white group-hover:text-neon-cyan transition-colors">AI Generate</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="backstory"
                name="backstory"
                value={formData.backstory}
                onChange={handleChange}
                rows={12}
                className={`input-field resize-none text-sm leading-relaxed ${errors.backstory ? 'border-neon-pink/50 shadow-lg shadow-neon-pink/30 ring-2 ring-neon-pink/20' : 'focus:border-neon-yellow/50'}`}
                placeholder="Write a detailed backstory for your character... Who are they? What's their history? What motivates them? What are their dreams and fears?"
              />
              {errors.backstory && (
                <p className="mt-3 text-sm text-neon-pink font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.backstory}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-white/40 font-mono">
                  {formData.backstory.length} / 50 minimum
                </p>
                <div className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full ${formData.backstory.length >= 50 ? 'bg-neon-green/20 text-neon-green' : 'bg-white/5 text-white/40'
                  }`}>
                  {formData.backstory.length >= 50 ? '✓ Complete' : 'In Progress'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="card border-neon-pink/50 bg-neon-pink/10">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-neon-pink flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-neon-pink font-medium">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-outline sm:w-auto group"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            className="btn-primary sm:w-auto group relative overflow-hidden"
            disabled={loading || (!isEditMode && characterCount >= 5)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{isEditMode ? 'Update Character' : 'Create Character'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
