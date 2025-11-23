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
        name: '' // Optional custom name
    });

    const generateCharacter = async () => {
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
            const imagePromise = (async () => {
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
            characterData.gender = selectedGender;

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

            if (existing && existing.length >= 2) {
                setError('You have reached the maximum limit of 2 characters. Please delete one to save this new one.');
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
        <div className="max-w-4xl mx-auto fade-in">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-pure-white mb-4">
                    Anime Character <span className="text-neon-pink">Generator</span>
                </h1>
                <p className="text-white/60 text-lg">
                    Let AI craft your next protagonist (or villain)
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card border-neon-pink/30">
                        <h2 className="text-xl font-bold text-pure-white mb-4 flex items-center gap-2">
                            <span className="text-neon-pink">⚙️</span> Settings
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/70 uppercase mb-2">Genre</label>
                                <select
                                    value={options.genre}
                                    onChange={(e) => setOptions({ ...options, genre: e.target.value })}
                                    className="input-field text-sm"
                                >
                                    {ANIME_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/70 uppercase mb-2">Archetype</label>
                                <select
                                    value={options.archetype}
                                    onChange={(e) => setOptions({ ...options, archetype: e.target.value })}
                                    className="input-field text-sm"
                                >
                                    {ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/70 uppercase mb-2">Gender</label>
                                <select
                                    value={options.gender}
                                    onChange={(e) => setOptions({ ...options, gender: e.target.value })}
                                    className="input-field text-sm"
                                >
                                    <option value="Random">Random</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Non-binary">Non-binary</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/70 uppercase mb-2">Name (Optional)</label>
                                <input
                                    type="text"
                                    value={options.name}
                                    onChange={(e) => setOptions({ ...options, name: e.target.value })}
                                    placeholder="Leave empty for random"
                                    className="input-field text-sm"
                                >
                                </input>
                            </div>

                            <button
                                onClick={generateCharacter}
                                disabled={loading}
                                className="w-full btn-primary bg-neon-pink hover:bg-neon-pink/90 shadow-neon-pink/20"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xl">✨</span> Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Result Display */}
                <div className="lg:col-span-2">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {!generatedCharacter && !loading && (
                        <div className="h-full min-h-[400px] card border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-dark-gray rounded-full flex items-center justify-center mb-4 text-4xl opacity-50">
                                🎌
                            </div>
                            <h3 className="text-xl font-bold text-white/40">Ready to Create</h3>
                            <p className="text-white/30 max-w-xs mt-2">
                                Select your preferences and hit generate to create a unique anime character.
                            </p>
                        </div>
                    )}

                    {loading && !generatedCharacter && (
                        <div className="h-full min-h-[400px] card flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-neon-pink border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-neon-pink animate-pulse">Dreaming up a character...</p>
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
                                            className="w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <p className="text-xs text-center px-4 text-white/60">
                                                (AI Generated Profile)<br />
                                                Image is a placeholder
                                            </p>
                                        </div>
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
