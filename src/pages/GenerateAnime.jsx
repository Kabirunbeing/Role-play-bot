import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getGroqKey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Groq from 'groq-sdk';

const ANIME_GENRES = [
    'Shonen (Action/Adventure)',
    'Shojo (Romance/Drama)',
    'Isekai (Another World)',
    'Mecha (Robots)',
    'Cyberpunk (Futuristic)',
    'Dark Fantasy',
    'Slice of Life',
    'Sports',
    'Magical Girl'
];

const ARCHETYPES = [
    'The Chosen One',
    'The Reluctant Hero',
    'The Tsundere',
    'The Kuudere (Cool/Aloof)',
    'The Genki (Energetic)',
    'The Villainess',
    'The Mentor',
    'The Rival',
    'The Comic Relief'
];

export default function GenerateAnime() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [generatedCharacter, setGeneratedCharacter] = useState(null);
    const [error, setError] = useState('');

    const [options, setOptions] = useState({
        genre: 'Shonen (Action/Adventure)',
        archetype: 'The Chosen One',
        gender: 'Random',
        name: '', // Optional custom name
        animeName: '' // Optional anime name
    });

    const [rateLimit, setRateLimit] = useState({ remaining: 7, resetTime: null });

    // Check rate limit on load
    useState(() => {
        const checkLimit = () => {
            const stored = localStorage.getItem('anime_gen_limit');
            if (!stored) return;

            const { count, resetTime } = JSON.parse(stored);
            if (Date.now() > resetTime) {
                localStorage.removeItem('anime_gen_limit');
                setRateLimit({ remaining: 7, resetTime: null });
            } else {
                setRateLimit({ remaining: Math.max(0, 7 - count), resetTime });
            }
        };
        checkLimit();
        // Set an interval to check for reset every minute
        const interval = setInterval(checkLimit, 60000);
        return () => clearInterval(interval);
    }, []);

    const updateUsage = () => {
        const stored = localStorage.getItem('anime_gen_limit');
        let data = stored ? JSON.parse(stored) : { count: 0, resetTime: Date.now() + 5 * 60 * 60 * 1000 };

        // If expired, reset
        if (Date.now() > data.resetTime) {
            data = { count: 0, resetTime: Date.now() + 5 * 60 * 60 * 1000 };
        }

        data.count += 1;
        localStorage.setItem('anime_gen_limit', JSON.stringify(data));
        setRateLimit({ remaining: Math.max(0, 7 - data.count), resetTime: data.resetTime });
    };

    const generateCharacter = async () => {
        if (rateLimit.remaining <= 0) {
            const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
            const hours = Math.floor(minutesLeft / 60);
            const mins = minutesLeft % 60;
            setError(`Daily limit reached. Credits reset in ${hours}h ${mins}m.`);
            return;
        }

        if (!options.name || !options.name.trim()) {
            setError('Please enter a character name.');
            return;
        }

        updateUsage(); // Deduct credit immediately
        setLoading(true);
        setError('');
        setGeneratedCharacter(null);

        try {
            const { apiKey, error: keyError } = await getGroqKey();
            if (keyError || !apiKey) throw new Error('Failed to get API key');

            const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

            // 1. Determine gender upfront to allow parallel fetching
            let selectedGender = options.gender;
            if (selectedGender === 'Random') {
                const genders = ['Male', 'Female', 'Non-binary'];
                selectedGender = genders[Math.floor(Math.random() * genders.length)];
            }

            // 2. Prepare Image Fetch Promise
            // 2. Prepare Image Fetch Promise
            const imagePromise = (async () => {
                // Try to fetch specific character image if name is provided
                if (options.name && options.name.trim()) {
                    try {
                        let query = options.name;
                        if (options.animeName && options.animeName.trim()) {
                            query += ` ${options.animeName}`;
                        }
                        const response = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`);
                        const data = await response.json();
                        if (data.data && data.data.length > 0) {
                            return data.data[0].images.jpg.image_url;
                        }
                    } catch (e) {
                        console.error('Jikan fetch failed:', e);
                        // Continue to fallback
                    }
                }

                try {
                    let category = 'waifu';
                    if (selectedGender === 'Male') {
                        category = 'husbando';
                    } else if (selectedGender === 'Female') {
                        category = 'waifu';
                    } else {
                        category = Math.random() > 0.5 ? 'waifu' : 'husbando';
                    }

                    const response = await fetch(`https://nekos.best/api/v2/${category}`);
                    const data = await response.json();
                    return data.results?.[0]?.url;
                } catch (e) {
                    console.error('Image fetch failed:', e);
                    return null;
                }
            })();

            // 3. Prepare Text Generation Promise
            const prompt = `Generate a unique and detailed anime character profile based on the following criteria:
      - Genre: ${options.genre}
      - Archetype: ${options.archetype}
      - Gender: ${selectedGender}
      ${options.name ? `- Name: ${options.name}` : ''}
      ${options.animeName ? `- Anime Source: ${options.animeName}` : ''}
      (If this is a known character, try to match their canon personality and backstory from the specified anime if provided)

      Return the response in strictly valid JSON format with the following fields:
      {
        "name": "Character Name",
        "title": "Character Title/Epithet",
        "age": "Age (number or string)",
        "gender": "Gender",
        "personality": "One word personality type (e.g., friendly, sarcastic, wise, etc.)",
        "appearance": "Visual description of the character (hair, eyes, clothing, etc.)",
        "special_ability": "Name and description of their power or skill",
        "backstory": "A detailed backstory (100-150 words) fitting the genre and archetype."
      }
      Do not include any markdown formatting or extra text. Just the JSON.`;

            const textPromise = groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are an expert anime character creator. Output only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.8,
                max_tokens: 1000,
            });

            // 4. Run both in parallel
            const [completion, imageUrl] = await Promise.all([textPromise, imagePromise]);

            // 5. Process Results
            const content = completion.choices[0]?.message?.content;
            const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const characterData = JSON.parse(jsonStr);

            // Use fetched image or fallback
            characterData.imageUrl = imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(characterData.name)}&background=random&size=256`;

            // Ensure gender matches what we decided
            // If user explicitly picked a gender, enforce it.
            // If user picked Random, and we have a name, trust the AI (Canon).
            // If user picked Random, and no name, enforce the random choice we made (to match the image category).
            if (options.gender !== 'Random' || !options.name) {
                characterData.gender = selectedGender;
            }

            setGeneratedCharacter(characterData);
        } catch (err) {
            console.error('Generation error:', err);
            setError('Failed to generate character. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const saveCharacter = async () => {
        if (!generatedCharacter) return;
        setLoading(true);

        try {
            // Check limit first
            const { data: existing } = await supabase
                .from('characters')
                .select('id')
                .eq('user_id', user.id);

            if (existing && existing.length >= 5) {
                setError('You have reached the maximum limit of 5 characters. Please delete one to save this new one.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('characters')
                .insert([
                    {
                        user_id: user.id,
                        name: generatedCharacter.name,
                        personality: generatedCharacter.personality.toLowerCase(),
                        backstory: `${generatedCharacter.backstory}\n\n**Special Ability:** ${generatedCharacter.special_ability}\n**Appearance:** ${generatedCharacter.appearance}`,
                        age: parseInt(generatedCharacter.age) || 18,
                        gender: generatedCharacter.gender,
                        image_url: generatedCharacter.imageUrl, // They can update this later
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            navigate(`/chat/${data.id}`);
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save character.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 fade-in">
            {/* Header Section */}
            <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-pure-white mb-3 sm:mb-4 tracking-tight">
                    Authentic Anime{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-pink">
                        Character Generator
                    </span>
                </h1>
                <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-4 sm:mb-6">
                    Enter a name to generate an <strong className="text-white/90">authentic</strong> anime character with real images and canon details.
                </p>

                {/* Credits Counter */}
                <div className="inline-flex items-center gap-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-neon-pink/10 via-neon-purple/10 to-neon-pink/10 border border-neon-pink/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-neon-pink animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                        <span className="text-white/70 text-xs sm:text-sm font-semibold uppercase tracking-wide">Credits</span>
                    </div>
                    <div className="h-5 w-px bg-white/20"></div>
                    <div className="flex items-center gap-2">
                        <span className={`text-base sm:text-lg font-bold ${rateLimit.remaining <= 2 ? 'text-red-400' : 'text-neon-pink'}`}>
                            {rateLimit.remaining} / 7
                        </span>
                        {rateLimit.remaining < 7 && (
                            <span className="text-[10px] sm:text-xs text-white/30 font-mono">
                                (↻ {Math.ceil((rateLimit.resetTime - Date.now()) / (1000 * 60 * 60))}h)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Controls */}
                <div className="lg:col-span-1">
                    <div className="card border-neon-pink/30 hover:border-neon-pink/50 transition-all duration-300">
                        <h2 className="text-lg sm:text-xl font-bold text-pure-white mb-5 sm:mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-neon-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neon-pink">Settings</span>
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-white/80 uppercase mb-2 tracking-wider">
                                    Character Name <span className="text-neon-pink">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={options.name}
                                    onChange={(e) => setOptions({ ...options, name: e.target.value })}
                                    placeholder="e.g. Naruto Uzumaki"
                                    className="input-field text-sm sm:text-base focus:border-neon-pink/50"
                                />
                                <p className="text-[10px] sm:text-xs text-white/40 mt-1.5 leading-relaxed">
                                    Enter a known character name to fetch their real image and details.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-white/80 uppercase mb-2 tracking-wider">Anime Name (Optional)</label>
                                <input
                                    type="text"
                                    value={options.animeName}
                                    onChange={(e) => setOptions({ ...options, animeName: e.target.value })}
                                    placeholder="e.g. Naruto Shippuden"
                                    className="input-field text-sm sm:text-base focus:border-neon-purple/50"
                                />
                                <p className="text-[10px] sm:text-xs text-white/40 mt-1.5 leading-relaxed">
                                    Specify the anime to ensure we find the right character.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-white/80 uppercase mb-2 tracking-wider">Genre</label>
                                    <select
                                        value={options.genre}
                                        onChange={(e) => setOptions({ ...options, genre: e.target.value })}
                                        className="input-field text-xs sm:text-sm"
                                    >
                                        {ANIME_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-white/80 uppercase mb-2 tracking-wider">Archetype</label>
                                    <select
                                        value={options.archetype}
                                        onChange={(e) => setOptions({ ...options, archetype: e.target.value })}
                                        className="input-field text-xs sm:text-sm"
                                    >
                                        {ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-white/80 uppercase mb-2 tracking-wider">Gender</label>
                                <select
                                    value={options.gender}
                                    onChange={(e) => setOptions({ ...options, gender: e.target.value })}
                                    className="input-field text-sm sm:text-base"
                                >
                                    <option value="Random">Random</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Non-binary">Non-binary</option>
                                </select>
                            </div>



                            <button
                                onClick={generateCharacter}
                                disabled={loading || rateLimit.remaining <= 0}
                                className="w-full btn-primary group relative overflow-hidden bg-gradient-to-r from-neon-pink via-neon-purple to-neon-pink hover:shadow-2xl hover:shadow-neon-pink/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-sm sm:text-base">Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg sm:text-xl">✨</span>
                                        <span className="text-sm sm:text-base font-bold">Generate Character</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Result Display */}
                <div className="lg:col-span-2">
                    {error && (
                        <div className="p-4 sm:p-5 bg-red-500/10 border-2 border-red-500/30 rounded-xl mb-6 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-400 text-sm sm:text-base font-medium">{error}</p>
                        </div>
                    )}

                    {!generatedCharacter && !loading && (
                        <div className="h-full min-h-[450px] sm:min-h-[500px] card border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8 sm:p-12 hover:border-white/20 transition-all duration-300">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 rounded-full flex items-center justify-center mb-5 sm:mb-6 text-4xl sm:text-5xl opacity-60">
                                🎌
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white/50 mb-2">Ready to Create</h3>
                            <p className="text-sm sm:text-base text-white/30 max-w-sm mx-auto leading-relaxed">
                                Configure your settings and hit generate to create a unique anime character.
                            </p>
                        </div>
                    )}

                    {loading && !generatedCharacter && (
                        <div className="h-full min-h-[450px] sm:min-h-[500px] card flex flex-col items-center justify-center bg-gradient-to-br from-neon-pink/5 via-neon-purple/5 to-neon-pink/5">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-neon-pink/30 border-t-neon-pink rounded-full animate-spin"></div>
                            </div>
                            <p className="text-neon-pink text-base sm:text-lg font-semibold animate-pulse mb-2">Dreaming up a character...</p>
                            <p className="text-white/40 text-xs sm:text-sm">This may take a few moments</p>
                        </div>
                    )}

                    {generatedCharacter && (
                        <div className="card border-neon-pink/50 bg-gradient-to-br from-dark-gray to-neon-pink/5 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Visual Placeholder */}
                                <div className="w-full md:w-1/3 flex-shrink-0">
                                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black/50 border border-white/10 relative group">
                                        <img
                                            src={generatedCharacter.imageUrl}
                                            alt={generatedCharacter.name}
                                            className="w-full h-full object-cover transition-opacity"
                                        />
                                    </div>
                                    <div className="mt-4 text-center">
                                        <span className="inline-block px-3 py-1 rounded-full bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-xs font-bold uppercase tracking-wider">
                                            {generatedCharacter.gender} • {generatedCharacter.age}
                                        </span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h2 className="text-3xl font-display font-bold text-pure-white">{generatedCharacter.name}</h2>
                                        <p className="text-neon-pink font-medium italic">{generatedCharacter.title}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                            <p className="text-xs text-white/40 uppercase mb-1">Personality</p>
                                            <p className="text-white/90 font-medium">{generatedCharacter.personality}</p>
                                        </div>
                                        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                            <p className="text-xs text-white/40 uppercase mb-1">Special Ability</p>
                                            <p className="text-white/90 font-medium">{generatedCharacter.special_ability}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-white/40 uppercase mb-2">Appearance</p>
                                        <p className="text-sm text-white/70 leading-relaxed">{generatedCharacter.appearance}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-white/40 uppercase mb-2">Backstory</p>
                                        <p className="text-sm text-white/70 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                            {generatedCharacter.backstory}
                                        </p>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            onClick={saveCharacter}
                                            disabled={loading}
                                            className="flex-1 btn-primary bg-neon-green text-pure-black hover:bg-neon-green/90"
                                        >
                                            Save Character
                                        </button>
                                        <button
                                            onClick={generateCharacter}
                                            disabled={loading}
                                            className="btn-icon"
                                            title="Regenerate"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
