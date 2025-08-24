/**
 * @fileoverview Audio Controls Component - Manages audio playback and sound effects
 * @module AudioControls
 * @requires react
 * @requires react-use
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'react-use';

// Audio state constants
const AUDIO_STATES = {
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
};

// Default audio settings
const DEFAULT_SETTINGS = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  isMuted: false,
};

/**
 * @typedef {Object} AudioSettings
 * @property {number} masterVolume - Master volume level (0-1)
 * @property {number} musicVolume - Background music volume level (0-1)
 * @property {number} sfxVolume - Sound effects volume level (0-1)
 * @property {boolean} isMuted - Global mute state
 */

/**
 * AudioControls Component - Manages audio playback and settings
 * @component
 */
const AudioControls = () => {
  // Persistent settings storage
  const [settings, setSettings] = useLocalStorage('audioSettings', DEFAULT_SETTINGS);
  
  // State management
  const [currentState, setCurrentState] = useState(AUDIO_STATES.STOPPED);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [error, setError] = useState(null);

  // Audio element references
  const backgroundMusicRef = useRef(null);
  const sfxPoolRef = useRef(new Map());

  /**
   * Initializes the audio context and sets up audio nodes
   * @private
   */
  const initializeAudio = useCallback(async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      return audioContext;
    } catch (err) {
      setError('Failed to initialize audio context');
      console.error('Audio initialization error:', err);
      return null;
    }
  }, []);

  /**
   * Updates audio settings and persists changes
   * @param {Partial<AudioSettings>} newSettings
   */
  const updateSettings = useCallback((newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
  }, [setSettings]);

  /**
   * Plays a sound effect
   * @param {string} sfxId - Sound effect identifier
   * @param {Object} options - Playback options
   * @throws {Error} If sound effect loading fails
   */
  const playSoundEffect = useCallback(async (sfxId, options = {}) => {
    try {
      if (settings.isMuted) return;

      const sfx = sfxPoolRef.current.get(sfxId);
      if (!sfx) {
        throw new Error(`Sound effect ${sfxId} not found`);
      }

      const audio = new Audio(sfx.src);
      audio.volume = settings.sfxVolume * settings.masterVolume;
      
      await audio.play();

      // Cleanup after playback
      audio.onended = () => {
        audio.remove();
      };
    } catch (err) {
      setError(`Failed to play sound effect: ${sfxId}`);
      console.error('Sound effect playback error:', err);
    }
  }, [settings]);

  /**
   * Controls background music playback
   * @param {string} trackUrl - URL of the music track
   * @returns {Promise<void>}
   */
  const playBackgroundMusic = useCallback(async (trackUrl) => {
    try {
      if (!backgroundMusicRef.current) {
        backgroundMusicRef.current = new Audio();
      }

      const audio = backgroundMusicRef.current;
      audio.src = trackUrl;
      audio.loop = true;
      audio.volume = settings.musicVolume * settings.masterVolume;

      setCurrentTrack(trackUrl);
      setCurrentState(AUDIO_STATES.PLAYING);
      
      await audio.play();
    } catch (err) {
      setError('Failed to play background music');
      setCurrentState(AUDIO_STATES.ERROR);
      console.error('Background music playback error:', err);
    }
  }, [settings]);

  /**
   * Toggles global mute state
   */
  const toggleMute = useCallback(() => {
    updateSettings({ isMuted: !settings.isMuted });
  }, [settings.isMuted, updateSettings]);

  // Effect to handle volume changes
  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = settings.isMuted ? 0 : 
        settings.musicVolume * settings.masterVolume;
    }
  }, [settings]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
      sfxPoolRef.current.clear();
    };
  }, []);

  return {
    // Public API
    playSound: playSoundEffect,
    playMusic: playBackgroundMusic,
    toggleMute,
    updateSettings,
    currentState,
    settings,
    error,

    // Helper methods
    isPlaying: currentState === AUDIO_STATES.PLAYING,
    currentTrack,
  };
};

export default AudioControls;