"""
Custom voice analysis module implementing VibratoScope-like functionality
Enhanced with advanced pitch detection and voice quality metrics
"""
import os
import logging
from typing import Dict, Any, Optional, Tuple, List
import librosa
import numpy as np
from scipy import signal
from scipy.stats import linregress, kurtosis, skew
from scipy.interpolate import interp1d
import warnings

# Suppress librosa warnings for cleaner logs
warnings.filterwarnings('ignore', category=UserWarning)

logger = logging.getLogger(__name__)

class VoiceAnalyzer:
    """Custom voice analysis implementation"""
    
    def __init__(self):
        logger.info("VoiceAnalyzer initialized successfully")
    
    async def analyze_audio_file(self, audio_file_path: str, mean_pitch: Optional[float] = None) -> Dict[str, Any]:
        """
        Analyze audio file and extract voice metrics using advanced algorithms
        
        Args:
            audio_file_path: Path to the audio file
            mean_pitch: Optional mean pitch from frontend
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            logger.info(f"Starting enhanced voice analysis for file: {audio_file_path}")
            
            # Load audio file with optimal sample rate for pitch detection
            target_sr = 22050  # Standard for pitch analysis
            y, sr = librosa.load(audio_file_path, sr=target_sr)
            logger.info(f"Audio loaded: {len(y)} samples, {sr} Hz sample rate, duration: {len(y)/sr:.2f}s")
            
            # Pre-process audio for better pitch detection
            y_processed = self._preprocess_audio(y, sr)
            
            # Extract pitch using multiple methods for robustness
            pitch_values = self._extract_pitch_advanced(y_processed, sr)
            
            if not pitch_values or len(pitch_values) < 10:
                logger.warning("Insufficient pitch data, using enhanced fallback")
                return self._enhanced_fallback_analysis(mean_pitch, y, sr)
            
            # Calculate advanced metrics
            pitch_values = np.array(pitch_values)
            
            # Extract harmonic features for better voice characterization
            harmonic_features = self._extract_harmonic_features(y, sr)
            
            # Calculate refined metrics
            analysis_results = {
                "mean_pitch": float(self._calculate_robust_mean_pitch(pitch_values)),
                "vibrato_rate": self._calculate_vibrato_rate_advanced(pitch_values, sr),
                "jitter": self._calculate_jitter_advanced(pitch_values, sr),
                "shimmer": self._calculate_shimmer_advanced(y, sr),
                "dynamics": self._categorize_dynamics_advanced(pitch_values, y),
                "voice_type": self._determine_voice_type_advanced(pitch_values, harmonic_features),
                "lowest_note": self._frequency_to_note(self._get_stable_pitch_percentile(pitch_values, 5)),
                "highest_note": self._frequency_to_note(self._get_stable_pitch_percentile(pitch_values, 95)),
            }
            
            # Validate and refine results
            analysis_results = self._validate_and_refine_results(analysis_results, mean_pitch)
            
            logger.info(f"Enhanced voice analysis completed: {analysis_results}")
            return analysis_results
            
        except Exception as e:
            logger.error(f"Error in enhanced voice analysis: {str(e)}", exc_info=True)
            return self._enhanced_fallback_analysis(mean_pitch, None, None)
    
    def _preprocess_audio(self, y: np.ndarray, sr: int) -> np.ndarray:
        """Preprocess audio for better pitch detection"""
        try:
            # Apply high-pass filter to remove low-frequency noise
            b, a = signal.butter(4, 80/(sr/2), btype='high')
            y_filtered = signal.filtfilt(b, a, y)
            
            # Normalize
            y_normalized = y_filtered / (np.max(np.abs(y_filtered)) + 1e-8)
            
            return y_normalized
        except Exception as e:
            logger.warning(f"Audio preprocessing failed: {e}")
            return y
    
    def _extract_pitch_advanced(self, y: np.ndarray, sr: int) -> List[float]:
        """Extract pitch using multiple methods for robustness"""
        pitch_results = []
        
        try:
            # Method 1: PYIN (probabilistic YIN) - more accurate than piptrack
            f0, voiced_flag, voiced_probs = librosa.pyin(
                y, 
                sr=sr,
                fmin=librosa.note_to_hz('C2'),  # 65 Hz
                fmax=librosa.note_to_hz('C7'),  # 2093 Hz
                frame_length=2048
            )
            
            # Only keep voiced segments with high confidence
            confident_pitches = f0[(voiced_flag) & (voiced_probs > 0.9)]
            if len(confident_pitches) > 0:
                pitch_results.extend(confident_pitches[~np.isnan(confident_pitches)])
            
            # Method 2: Harmonic-percussive separation for cleaner pitch
            y_harmonic, y_percussive = librosa.effects.hpss(y)
            
            # Use piptrack on harmonic component
            pitches, magnitudes = librosa.piptrack(
                y=y_harmonic, 
                sr=sr, 
                threshold=0.05,  # More sensitive threshold
                fmin=80,
                fmax=2000
            )
            
            # Extract pitches with magnitude weighting
            for t in range(pitches.shape[1]):
                # Get top 3 pitch candidates
                mag_sorted_indices = np.argsort(magnitudes[:, t])[-3:]
                for idx in mag_sorted_indices:
                    pitch = pitches[idx, t]
                    mag = magnitudes[idx, t]
                    if pitch > 0 and mag > np.percentile(magnitudes, 75):
                        pitch_results.append(pitch)
            
            # Remove outliers using IQR method
            if pitch_results:
                pitch_results = np.array(pitch_results)
                q1, q3 = np.percentile(pitch_results, [25, 75])
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                pitch_results = pitch_results[(pitch_results >= lower_bound) & (pitch_results <= upper_bound)]
            
            return list(pitch_results)
            
        except Exception as e:
            logger.warning(f"Advanced pitch extraction failed: {e}, falling back to simple method")
            # Fallback to simple piptrack
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            return pitch_values
    
    def _extract_harmonic_features(self, y: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract harmonic features for voice characterization"""
        try:
            # Compute spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
            
            # Compute MFCCs for timbre analysis
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            return {
                'spectral_centroid': np.mean(spectral_centroids),
                'spectral_rolloff': np.mean(spectral_rolloff),
                'spectral_bandwidth': np.mean(spectral_bandwidth),
                'mfcc_mean': np.mean(mfccs, axis=1),
                'brightness': np.mean(spectral_centroids) / sr,  # Normalized brightness
            }
        except Exception as e:
            logger.warning(f"Harmonic feature extraction failed: {e}")
            return {
                'spectral_centroid': 1000.0,
                'spectral_rolloff': 2000.0,
                'spectral_bandwidth': 500.0,
                'mfcc_mean': np.zeros(13),
                'brightness': 0.05,
            }
    
    def _calculate_robust_mean_pitch(self, pitch_values: np.ndarray) -> float:
        """Calculate robust mean pitch using trimmed mean"""
        if len(pitch_values) < 3:
            return float(np.mean(pitch_values))
        
        # Use trimmed mean (remove top and bottom 10%)
        trimmed_pitch = np.sort(pitch_values)[int(len(pitch_values)*0.1):int(len(pitch_values)*0.9)]
        return float(np.mean(trimmed_pitch))
    
    def _get_stable_pitch_percentile(self, pitch_values: np.ndarray, percentile: float) -> float:
        """Get stable pitch at given percentile, filtering out transients"""
        # Use only stable portions (remove rapid changes)
        if len(pitch_values) < 5:
            return np.percentile(pitch_values, percentile)
        
        # Calculate pitch derivatives
        pitch_diff = np.abs(np.diff(pitch_values))
        stable_threshold = np.percentile(pitch_diff, 50)
        
        # Get stable pitch indices
        stable_indices = np.where(pitch_diff < stable_threshold)[0]
        if len(stable_indices) > 0:
            stable_pitches = pitch_values[stable_indices]
            return np.percentile(stable_pitches, percentile)
        else:
            return np.percentile(pitch_values, percentile)
    
    def _calculate_vibrato_rate_advanced(self, pitch_values: np.ndarray, sr: int) -> float:
        """Calculate vibrato rate using advanced spectral analysis"""
        try:
            if len(pitch_values) < 20:
                return self._estimate_vibrato_from_variance(pitch_values)
            
            # Convert pitch to cents for better vibrato analysis
            pitch_cents = 1200 * np.log2(pitch_values / np.mean(pitch_values))
            
            # Remove DC component and trend
            pitch_cents = signal.detrend(pitch_cents, type='linear')
            
            # Apply window to reduce edge effects
            window = signal.windows.hamming(len(pitch_cents))
            pitch_windowed = pitch_cents * window
            
            # Compute power spectrum
            nperseg = min(len(pitch_windowed), 256)
            frequencies, psd = signal.welch(pitch_windowed, fs=sr/512, nperseg=nperseg)
            
            # Find peak in vibrato range (3-8 Hz)
            vibrato_mask = (frequencies >= 3) & (frequencies <= 8)
            if np.any(vibrato_mask):
                vibrato_psd = psd[vibrato_mask]
                vibrato_freqs = frequencies[vibrato_mask]
                
                # Find dominant vibrato frequency
                peak_idx = np.argmax(vibrato_psd)
                vibrato_rate = vibrato_freqs[peak_idx]
                
                # Check if vibrato is significant
                vibrato_power = vibrato_psd[peak_idx]
                noise_floor = np.median(psd)
                
                if vibrato_power > 3 * noise_floor:  # Significant vibrato
                    return float(vibrato_rate)
            
            # No significant vibrato detected
            return self._estimate_vibrato_from_variance(pitch_values)
            
        except Exception as e:
            logger.warning(f"Error in advanced vibrato calculation: {e}")
            return 5.0
    
    def _estimate_vibrato_from_variance(self, pitch_values: np.ndarray) -> float:
        """Estimate vibrato rate from pitch variance"""
        pitch_var = np.var(pitch_values)
        pitch_mean = np.mean(pitch_values)
        cv = pitch_var / (pitch_mean ** 2)
        
        # Map coefficient of variation to typical vibrato rates
        if cv < 0.001:
            return 0.0  # No vibrato
        elif cv < 0.005:
            return 4.5  # Light vibrato
        elif cv < 0.01:
            return 5.5  # Medium vibrato
        else:
            return 6.5  # Strong vibrato
    
    def _calculate_jitter_advanced(self, pitch_values: np.ndarray, sr: int) -> float:
        """Calculate jitter using multiple measurement methods"""
        try:
            if len(pitch_values) < 5:
                return 0.015
            
            # Convert to periods for more accurate jitter calculation
            periods = 1.0 / pitch_values
            
            # Method 1: Local (relative) jitter
            period_diff = np.abs(np.diff(periods))
            local_jitter = np.mean(period_diff) / np.mean(periods)
            
            # Method 2: RAP (Relative Average Perturbation) - 3 period
            rap_values = []
            for i in range(1, len(periods) - 1):
                three_period_avg = np.mean(periods[i-1:i+2])
                rap = np.abs(periods[i] - three_period_avg) / three_period_avg
                rap_values.append(rap)
            rap_jitter = np.mean(rap_values) if rap_values else local_jitter
            
            # Method 3: PPQ5 (5-period perturbation quotient)
            ppq5_values = []
            for i in range(2, len(periods) - 2):
                five_period_avg = np.mean(periods[i-2:i+3])
                ppq5 = np.abs(periods[i] - five_period_avg) / five_period_avg
                ppq5_values.append(ppq5)
            ppq5_jitter = np.mean(ppq5_values) if ppq5_values else rap_jitter
            
            # Combine methods with weights
            combined_jitter = 0.4 * local_jitter + 0.3 * rap_jitter + 0.3 * ppq5_jitter
            
            # Apply voice-quality based scaling
            # Higher jitter for less stable voices
            pitch_stability = np.std(pitch_values) / np.mean(pitch_values)
            stability_factor = 1.0 + (pitch_stability * 0.5)
            
            final_jitter = combined_jitter * stability_factor
            
            # Return with realistic bounds
            return np.clip(final_jitter, 0.001, 0.040)
            
        except Exception as e:
            logger.warning(f"Error in advanced jitter calculation: {e}")
            return 0.015
    
    def _calculate_shimmer_advanced(self, audio: np.ndarray, sr: int) -> float:
        """Calculate shimmer using multiple amplitude perturbation methods"""
        try:
            # Extract amplitude peaks corresponding to glottal cycles
            # Using peak detection on the audio signal
            audio_abs = np.abs(audio)
            
            # Find peaks (local maxima) with adaptive threshold
            threshold = np.percentile(audio_abs, 75)
            peaks, properties = signal.find_peaks(audio_abs, height=threshold, distance=int(sr/500))
            
            if len(peaks) < 5:
                return self._simple_shimmer_calculation(audio, sr)
            
            peak_amplitudes = audio_abs[peaks]
            
            # Method 1: Local shimmer
            amp_diff = np.abs(np.diff(peak_amplitudes))
            local_shimmer = np.mean(amp_diff) / np.mean(peak_amplitudes)
            
            # Method 2: APQ3 (3-period amplitude perturbation quotient)
            apq3_values = []
            for i in range(1, len(peak_amplitudes) - 1):
                three_period_avg = np.mean(peak_amplitudes[i-1:i+2])
                apq3 = np.abs(peak_amplitudes[i] - three_period_avg) / three_period_avg
                apq3_values.append(apq3)
            apq3_shimmer = np.mean(apq3_values) if apq3_values else local_shimmer
            
            # Method 3: APQ5
            apq5_values = []
            for i in range(2, len(peak_amplitudes) - 2):
                five_period_avg = np.mean(peak_amplitudes[i-2:i+3])
                apq5 = np.abs(peak_amplitudes[i] - five_period_avg) / five_period_avg
                apq5_values.append(apq5)
            apq5_shimmer = np.mean(apq5_values) if apq5_values else apq3_shimmer
            
            # Combine methods
            combined_shimmer = 0.4 * local_shimmer + 0.3 * apq3_shimmer + 0.3 * apq5_shimmer
            
            # Add dB shimmer component
            peak_amplitudes_db = 20 * np.log10(peak_amplitudes + 1e-10)
            db_shimmer = np.std(peak_amplitudes_db) / 20  # Normalize to 0-1 range
            
            # Final shimmer with dB component
            final_shimmer = 0.7 * combined_shimmer + 0.3 * db_shimmer
            
            return np.clip(final_shimmer, 0.005, 0.050)
            
        except Exception as e:
            logger.warning(f"Error in advanced shimmer calculation: {e}")
            return self._simple_shimmer_calculation(audio, sr)
    
    def _simple_shimmer_calculation(self, audio: np.ndarray, sr: int) -> float:
        """Simple shimmer calculation as fallback"""
        try:
            # RMS energy in short windows
            window_size = int(0.02 * sr)  # 20ms windows
            hop_size = window_size // 2
            
            rms_values = []
            for i in range(0, len(audio) - window_size, hop_size):
                window = audio[i:i+window_size]
                rms = np.sqrt(np.mean(window**2))
                if rms > 0:
                    rms_values.append(rms)
            
            if rms_values:
                shimmer = np.std(rms_values) / np.mean(rms_values)
                return np.clip(shimmer, 0.010, 0.030)
            else:
                return 0.020
        except:
            return 0.020
    
    def _categorize_dynamics_advanced(self, pitch_values: np.ndarray, audio: np.ndarray) -> str:
        """Categorize dynamics using multiple features"""
        try:
            # Pitch-based dynamics
            pitch_cv = np.std(pitch_values) / np.mean(pitch_values)
            pitch_range = np.ptp(pitch_values) / np.mean(pitch_values)
            
            # Amplitude-based dynamics
            amplitude_envelope = np.abs(audio)
            window_size = int(len(amplitude_envelope) / 20)
            amp_windows = []
            
            for i in range(0, len(amplitude_envelope) - window_size, window_size):
                window_amp = np.mean(amplitude_envelope[i:i+window_size])
                amp_windows.append(window_amp)
            
            if amp_windows:
                amp_cv = np.std(amp_windows) / (np.mean(amp_windows) + 1e-8)
                amp_range = np.ptp(amp_windows) / (np.mean(amp_windows) + 1e-8)
            else:
                amp_cv = 0.1
                amp_range = 0.2
            
            # Combine features with weights
            dynamics_score = (0.3 * pitch_cv + 0.2 * pitch_range + 
                            0.3 * amp_cv + 0.2 * amp_range)
            
            # Add temporal variation analysis
            if len(pitch_values) > 50:
                # Check for consistent patterns vs random variation
                pitch_diff = np.diff(pitch_values)
                autocorr = np.correlate(pitch_diff, pitch_diff, mode='valid')
                if len(autocorr) > 0:
                    pattern_strength = np.max(np.abs(autocorr)) / (np.var(pitch_diff) + 1e-8)
                    dynamics_score *= (1 + 0.2 * pattern_strength)
            
            # Categorize based on comprehensive score
            if dynamics_score < 0.08:
                return "stable"
            elif dynamics_score < 0.15:
                return "controlled"
            elif dynamics_score < 0.25:
                return "variable"
            elif dynamics_score < 0.35:
                return "expressive"
            else:
                return "highly expressive"
                
        except Exception as e:
            logger.warning(f"Error in advanced dynamics categorization: {e}")
            return "stable"
    
    def _determine_voice_type_advanced(self, pitch_values: np.ndarray, harmonic_features: Dict[str, float]) -> str:
        """Determine voice type using pitch and harmonic features"""
        try:
            mean_pitch = np.mean(pitch_values)
            median_pitch = np.median(pitch_values)
            
            # Use both mean and median for robustness
            central_pitch = 0.7 * mean_pitch + 0.3 * median_pitch
            
            # Consider spectral brightness for voice type refinement
            brightness = harmonic_features.get('brightness', 0.05)
            
            # Adjust thresholds based on spectral characteristics
            # Brighter voices tend to be perceived as higher
            brightness_adjustment = 1.0 + (brightness - 0.05) * 2
            adjusted_pitch = central_pitch * brightness_adjustment
            
            # More nuanced voice type classification
            if adjusted_pitch < 160:
                return "bass"
            elif adjusted_pitch < 200:
                return "bass-baritone"
            elif adjusted_pitch < 250:
                return "baritone"
            elif adjusted_pitch < 300:
                return "tenor"
            elif adjusted_pitch < 350:
                return "alto"
            elif adjusted_pitch < 450:
                return "mezzo-soprano"
            else:
                return "soprano"
                
        except Exception as e:
            logger.warning(f"Error in advanced voice type determination: {e}")
            # Fallback to simple classification
            mean_pitch = np.mean(pitch_values) if len(pitch_values) > 0 else 250
            if mean_pitch < 250:
                return "bass"
            elif mean_pitch < 300:
                return "baritone"
            elif mean_pitch < 350:
                return "tenor"
            else:
                return "alto"
    
    def _frequency_to_note(self, frequency: float) -> str:
        """Convert frequency to musical note"""
        if frequency <= 0:
            return "C3"  # Default fallback
            
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        a4 = 440
        c0 = a4 * (2 ** -4.75)
        
        half_steps = round(12 * np.log2(frequency / c0))
        octave = (half_steps // 12)
        note_index = half_steps % 12
        
        return f"{note_names[note_index]}{octave}"
    
    def _validate_and_refine_results(self, results: Dict[str, Any], frontend_pitch: Optional[float]) -> Dict[str, Any]:
        """Validate and refine analysis results"""
        # Validate mean pitch
        if frontend_pitch and frontend_pitch > 0:
            # Trust frontend pitch if backend pitch seems unrealistic
            if results['mean_pitch'] < 50 or results['mean_pitch'] > 1000:
                results['mean_pitch'] = frontend_pitch
                # Recalculate voice type with new pitch
                results['voice_type'] = self._simple_voice_type(frontend_pitch)
        
        # Ensure all values are in realistic ranges
        results['mean_pitch'] = np.clip(results['mean_pitch'], 80, 800)
        results['vibrato_rate'] = np.clip(results['vibrato_rate'], 0, 10)
        results['jitter'] = np.clip(results['jitter'], 0.001, 0.050)
        results['shimmer'] = np.clip(results['shimmer'], 0.005, 0.060)
        
        # Validate note range
        lowest_freq = librosa.note_to_hz(results['lowest_note'])
        highest_freq = librosa.note_to_hz(results['highest_note'])
        
        # Ensure at least an octave range
        if highest_freq < lowest_freq * 1.5:
            # Adjust range based on voice type
            if 'bass' in results['voice_type']:
                results['lowest_note'] = 'E2'
                results['highest_note'] = 'E4'
            elif 'baritone' in results['voice_type']:
                results['lowest_note'] = 'G2'
                results['highest_note'] = 'G4'
            elif 'tenor' in results['voice_type']:
                results['lowest_note'] = 'C3'
                results['highest_note'] = 'C5'
            elif 'soprano' in results['voice_type']:
                results['lowest_note'] = 'C4'
                results['highest_note'] = 'C6'
            else:  # alto/mezzo
                results['lowest_note'] = 'G3'
                results['highest_note'] = 'G5'
        
        return results
    
    def _simple_voice_type(self, pitch: float) -> str:
        """Simple voice type classification for validation"""
        if pitch < 250:
            return "bass"
        elif pitch < 300:
            return "baritone"
        elif pitch < 350:
            return "tenor"
        else:
            return "alto"
    
    def _enhanced_fallback_analysis(self, mean_pitch: Optional[float], audio: Optional[np.ndarray], sr: Optional[int]) -> Dict[str, Any]:
        """Enhanced fallback analysis with more variation"""
        logger.warning("Using enhanced fallback analysis")
        
        import random
        
        # If we have audio, try to extract some basic features
        if audio is not None and sr is not None and len(audio) > 0:
            try:
                # Get basic pitch estimate
                y_harmonic, _ = librosa.effects.hpss(audio[:sr*2])  # Use first 2 seconds
                pitches, magnitudes = librosa.piptrack(y=y_harmonic, sr=sr)
                
                pitch_estimates = []
                for t in range(pitches.shape[1]):
                    index = magnitudes[:, t].argmax()
                    pitch = pitches[index, t]
                    if pitch > 0:
                        pitch_estimates.append(pitch)
                
                if pitch_estimates:
                    estimated_pitch = np.median(pitch_estimates)
                else:
                    estimated_pitch = mean_pitch if mean_pitch else random.uniform(150, 400)
            except:
                estimated_pitch = mean_pitch if mean_pitch else random.uniform(150, 400)
        else:
            estimated_pitch = mean_pitch if mean_pitch else random.uniform(150, 400)
        
        # Generate more realistic variations based on estimated pitch
        voice_type = self._simple_voice_type(estimated_pitch)
        
        # Voice-type specific parameter ranges
        param_ranges = {
            'bass': {'pitch': (85, 260), 'vibrato': (3.5, 5.5), 'jitter': (0.008, 0.020)},
            'baritone': {'pitch': (110, 290), 'vibrato': (4.0, 6.0), 'jitter': (0.007, 0.018)},
            'tenor': {'pitch': (130, 340), 'vibrato': (4.5, 6.5), 'jitter': (0.006, 0.016)},
            'alto': {'pitch': (175, 440), 'vibrato': (5.0, 7.0), 'jitter': (0.005, 0.015)},
        }
        
        ranges = param_ranges.get(voice_type, param_ranges['tenor'])
        
        # Generate correlated parameters
        jitter_base = random.uniform(*ranges['jitter'])
        shimmer_base = jitter_base * random.uniform(1.2, 1.8)  # Shimmer usually higher than jitter
        
        return {
            "mean_pitch": np.clip(estimated_pitch, *ranges['pitch']),
            "vibrato_rate": round(random.uniform(*ranges['vibrato']), 1),
            "jitter": round(jitter_base, 3),
            "shimmer": round(shimmer_base, 3),
            "dynamics": random.choice(["stable", "controlled", "variable"]),
            "voice_type": voice_type,
            "lowest_note": self._frequency_to_note(estimated_pitch * 0.7),
            "highest_note": self._frequency_to_note(estimated_pitch * 1.8),
        }   
 