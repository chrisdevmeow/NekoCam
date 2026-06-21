// ============================================================
// NEKOCAM – src/ui/ui-controller.js
// UI Controller – renders tabs, effect grid, sliders, buttons
// ============================================================

import { getCategories, getEffectsByCategory, getEffectById } from '../effects/effects-registry.js';
import { applyEffect, setIntensity, getCurrentEffect, getCurrentIntensity } from '../effects/effect-applier.js';
import { toggleRecording, isRecordingActive } from '../media/recorder.js';
import { downloadSnapshot } from '../media/snapshot.js';

// ---- State ----
let currentCategory = 'All';
let currentEffectId = null;
let callbacks = {};

// ---- Init UI ----
export function initUI({
    effects,
    onEffectSelect,
    onIntensityChange,
    onRecordToggle,
    onSnapshot,
} = {}) {
    callbacks = {
        onEffectSelect: onEffectSelect || (() => {}),
        onIntensityChange: onIntensityChange || (() => {}),
        onRecordToggle: onRecordToggle || (() => {}),
        onSnapshot: onSnapshot || (() => {}),
    };

    const categories = getCategories();
    renderTabs(categories);
    renderEffectsGrid('All');
    setupIntensitySlider();
    setupActionButtons();
    setupKeyboardShortcuts();

    console.log('[UI] Initialized');
}

// ---- Render category tabs ----
function renderTabs(categories) {
    const container = document.getElementById('tabs');
    if (!container) {
        console.warn('[UI] #tabs container not found');
        return;
    }

    container.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.dataset.category = cat;
        if (cat === currentCategory) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat;
            renderEffectsGrid(cat);
        });
        container.appendChild(btn);
    });
}

// ---- Render effects grid ----
function renderEffectsGrid(category) {
    const container = document.getElementById('effectsGrid');
    if (!container) {
        console.warn('[UI] #effectsGrid container not found');
        return;
    }

    const effects = getEffectsByCategory(category);
    container.innerHTML = '';

    effects.forEach(effect => {
        const btn = document.createElement('button');
        btn.textContent = effect.name;
        btn.dataset.id = effect.id;
        if (effect.id === getCurrentEffect()) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            document.querySelectorAll('#effectsGrid button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentEffectId = effect.id;
            applyEffect(effect.id, getCurrentIntensity());
            callbacks.onEffectSelect(effect.id);
        });
        container.appendChild(btn);
    });
}

// ---- Setup intensity slider ----
function setupIntensitySlider() {
    const slider = document.getElementById('intensity');
    const display = document.getElementById('intensityValue');
    
    if (!slider || !display) {
        console.warn('[UI] Intensity slider or display not found');
        return;
    }

    const currentIntensity = getCurrentIntensity();
    slider.value = currentIntensity;
    display.textContent = currentIntensity.toFixed(2);

    slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        display.textContent = val.toFixed(2);
        setIntensity(val);
        callbacks.onIntensityChange(val);
    });
}

// ---- Setup action buttons ----
function setupActionButtons() {
    const recordBtn = document.getElementById('recordBtn');
    const snapshotBtn = document.getElementById('snapshotBtn');

    if (recordBtn) {
        recordBtn.addEventListener('click', () => {
            const isRecording = isRecordingActive();
            if (isRecording) {
                recordBtn.textContent = '⏺ Record';
                recordBtn.classList.remove('recording');
            } else {
                recordBtn.textContent = '⏹ Stop';
                recordBtn.classList.add('recording');
            }
            toggleRecording();
            callbacks.onRecordToggle();
        });
    }

    if (snapshotBtn) {
        snapshotBtn.addEventListener('click', () => {
            const canvas = document.getElementById('canvas');
            if (canvas) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                downloadSnapshot(canvas, `neko-cam-${timestamp}.png`);
                callbacks.onSnapshot();
            } else {
                console.warn('[UI] Canvas not found for snapshot');
            }
        });
    }
}

// ---- Setup keyboard shortcuts ----
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        const isInput = event.target.tagName === 'INPUT';
        if (isInput) return;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                const effects = getEffectsByCategory(currentCategory);
                const currentIdx = effects.findIndex(e => e.id === getCurrentEffect());
                const nextIdx = (currentIdx + 1) % effects.length;
                const nextEffect = effects[nextIdx];
                if (nextEffect) {
                    applyEffect(nextEffect.id, getCurrentIntensity());
                    renderEffectsGrid(currentCategory);
                    callbacks.onEffectSelect(nextEffect.id);
                }
                event.preventDefault();
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
                const effects2 = getEffectsByCategory(currentCategory);
                const currentIdx2 = effects2.findIndex(e => e.id === getCurrentEffect());
                const prevIdx = (currentIdx2 - 1 + effects2.length) % effects2.length;
                const prevEffect = effects2[prevIdx];
                if (prevEffect) {
                    applyEffect(prevEffect.id, getCurrentIntensity());
                    renderEffectsGrid(currentCategory);
                    callbacks.onEffectSelect(prevEffect.id);
                }
                event.preventDefault();
                break;

            case 'r':
            case 'R':
                document.getElementById('recordBtn')?.click();
                break;

            case 's':
            case 'S':
                document.getElementById('snapshotBtn')?.click();
                break;
        }
    });
}

// ---- Select effect programmatically ----
export function selectEffect(effectId) {
    const effect = getEffectById(effectId);
    if (!effect) {
        console.warn(`[UI] Effect not found: ${effectId}`);
        return false;
    }

    // Update category if needed
    if (effect.category && effect.category !== currentCategory) {
        currentCategory = effect.category;
        document.querySelectorAll('#tabs button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === currentCategory);
        });
        renderEffectsGrid(currentCategory);
    }

    // Select effect in grid
    document.querySelectorAll('#effectsGrid button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.id === effectId);
    });

    applyEffect(effectId, getCurrentIntensity());
    callbacks.onEffectSelect(effectId);
    return true;
}

// ---- Get current category ----
export function getCurrentCategory() {
    return currentCategory;
}
