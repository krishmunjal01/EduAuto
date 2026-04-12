import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';

const VoiceMessage = () => {
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState<'male' | 'female'>('female');
  const [message, setMessage] = useState(
    'Hello, this is a message from your school. Your child scored 85% in Mathematics. Keep up the great work!'
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Load available browser voices
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  const getSelectedVoice = (): SpeechSynthesisVoice | undefined => {
    if (voices.length === 0) return undefined;
    // Try to find a matching gender voice
    const genderHints = voice === 'female'
      ? ['female', 'zira', 'samantha', 'google uk english female', 'microsoft zira']
      : ['male', 'david', 'google uk english male', 'microsoft david'];

    for (const hint of genderHints) {
      const found = voices.find(v => v.name.toLowerCase().includes(hint));
      if (found) return found;
    }
    // Fallback: pick English voice or first available
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  };

  const handlePlay = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    const selectedVoice = getSelectedVoice();
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.9;
    utterance.pitch = voice === 'female' ? 1.1 : 0.9;

    // Estimate duration for progress bar
    const estimatedDuration = (message.length / 15) * 1000; // ~15 chars/second
    const startTime = Date.now();
    
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / estimatedDuration) * 100, 95));
    }, 100);

    utterance.onend = () => {
      setPlaying(false);
      setProgress(100);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimeout(() => setProgress(0), 1000);
    };

    utterance.onerror = () => {
      setPlaying(false);
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Voice Messages</h1>
        <p className="text-sm text-muted-foreground">AI-generated voice previews using browser text-to-speech</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Message Input */}
        <div className="glass rounded-2xl p-6">
          <Label className="text-sm font-medium mb-2 block">Message to Speak</Label>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            className="bg-secondary/50 border-glass-border rounded-xl resize-none"
            placeholder="Type or paste a message to preview as voice..."
          />
        </div>

        <motion.div whileHover={{ scale: 1.01 }} className="glass rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl gradient-primary glow"><Mic className="w-6 h-6 text-primary-foreground" /></div>
            <div>
              <h3 className="font-semibold font-display text-lg">Voice Preview</h3>
              <p className="text-sm text-muted-foreground">
                {voices.length > 0
                  ? `Using: ${getSelectedVoice()?.name || 'Default'}`
                  : 'Loading voices...'}
              </p>
            </div>
          </div>

          {/* Waveform */}
          <div className="bg-secondary/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handlePlay}
                className="w-14 h-14 rounded-full gradient-primary glow flex items-center justify-center shrink-0">
                {playing ? <Pause className="w-6 h-6 text-primary-foreground" /> : <Play className="w-6 h-6 text-primary-foreground ml-1" />}
              </motion.button>
              <div className="flex-1 flex items-center gap-0.5 h-12">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div key={i}
                    animate={playing ? { height: [8, Math.random() * 40 + 8, 8] } : { height: 8 }}
                    transition={playing ? { duration: 0.5, repeat: Infinity, delay: i * 0.02 } : {}}
                    className="flex-1 rounded-full bg-primary/60" style={{ minWidth: 2 }} />
                ))}
              </div>
              <Volume2 className={`w-5 h-5 shrink-0 ${playing ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            {/* Progress bar */}
            {playing && (
              <div className="mt-3 h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div className="h-full gradient-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          {/* Voice Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Voice Type</Label>
            <div className="flex items-center gap-3">
              <button onClick={() => { setVoice('male'); window.speechSynthesis.cancel(); setPlaying(false); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${voice === 'male' ? 'gradient-primary text-primary-foreground glow' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}>Male</button>
              <button onClick={() => { setVoice('female'); window.speechSynthesis.cancel(); setPlaying(false); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${voice === 'female' ? 'gradient-primary text-primary-foreground glow' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}>Female</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VoiceMessage;
