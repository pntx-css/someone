import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import {
  getProgressiveEmptyCardCount,
  MAX_CUSTOM_PLACES,
  parseGoogleMapsUrl,
  type Coordinates,
  type CustomPlaceDraft,
} from '../data/customPlace';
import { specialPlaces} from '../data/specialPlaces';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { AnimatedText } from './AnimatedText';
import { ScrollWheel } from './ScrollWheel';
import 'maplibre-gl/dist/maplibre-gl.css';
import './SpecialChapter.css';

interface CustomPlace extends CustomPlaceDraft {
  id: string;
}

interface MapPlace {
  id: string;
  name: string;
  description: string;
  mapsUrl: string;
  coordinates: Coordinates | null;
}

interface PlannedVisit {
  placeId: string;
  time: string;
}

interface PlanSubmissionVisit {
  name: string;
  time: string;
  mapsUrl: string;
}

const HOME_COORDINATES: Coordinates = {
  latitude: -7.604534579811721,
  longitude: 110.80566972274204,
};

interface SpecialChapterProps {
  wishlistSent: boolean;
  onBack: () => void;
}

interface PlaceFormProps {
  initialPlace: CustomPlace | null;
  onCancel: () => void;
  onSave: (draft: CustomPlaceDraft) => string | null;
}

interface PlanTimeDialogProps {
  place: MapPlace;
  initialTime: string;
  onCancel: () => void;
  onSave: (time: string) => void;
  onRemove?: () => void;
}

const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 240;
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));

setWorkerUrl(mapWorkerUrl);

const haversineDistance = (from: Coordinates, to: Coordinates): number => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const startLatitude = radians(from.latitude);
  const endLatitude = radians(to.latitude);
  const value = Math.min(1,
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2
  );
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const PlanTimeDialog: React.FC<PlanTimeDialogProps> = ({
  place,
  initialTime,
  onCancel,
  onSave,
  onRemove,
}) => {
  const [hour, setHour] = useState(initialTime.slice(0, 2));
  const [minute, setMinute] = useState(initialTime.slice(3, 5));
  const [isEntering, setIsEntering] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeActionRef = useRef<(() => void) | null>(null);
  const closeCompletedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const pendingCloseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>('.special-time-wheels [role="listbox"]')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        '[tabindex]:not([tabindex="-1"]), input:not(:disabled), button:not(:disabled), a[href]'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onCancel]);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  const finishClose = () => {
    if (closeCompletedRef.current) return;
    closeCompletedRef.current = true;
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    closeActionRef.current?.();
  };

  const beginClose = (action: () => void) => {
    closeCompletedRef.current = false;
    closeActionRef.current = action;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(finishClose, 300);
  };

  const requestClose = (action: () => void) => {
    if (isClosing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      action();
    } else if (isEntering) {
      pendingCloseRef.current ??= action;
    } else {
      beginClose(action);
    }
  };

  const handleDialogAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.animationName === 'special-time-dialog-scroll-in') {
      setIsEntering(false);
      const pendingClose = pendingCloseRef.current;
      pendingCloseRef.current = null;
      if (pendingClose) beginClose(pendingClose);
    } else if (event.animationName === 'special-time-dialog-scroll-out') {
      finishClose();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const time = `${hour}:${minute}`;
    if (isClosing || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
    requestClose(() => onSave(time));
  };

  return createPortal(
    <div className={`special-modal-backdrop${isClosing ? ' is-closing' : ''}`}>
      <div
        ref={dialogRef}
        className={`special-place-dialog special-time-dialog${isClosing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="special-time-dialog-title"
        onAnimationEnd={handleDialogAnimationEnd}
      >
        <p className="special-eyebrow">a little time for us</p>
        <h3 id="special-time-dialog-title">Atur waktu kunjungan</h3>
        <p className="special-dialog-intro">
          {place.name}{place.description && place.description !== place.name ? ` · ${place.description}` : ''}
        </p>
        <form className="special-place-form" onSubmit={handleSubmit}>
          <p className="special-time-field-label">Waktu</p>
          <div className="special-time-wheels" role="group" aria-label="Pilih waktu kunjungan">
            <div className="special-time-wheel-column">
              <span className="special-time-wheel-label">Jam</span>
              <ScrollWheel
                options={HOURS}
                value={hour}
                onChange={(value) => setHour(String(value))}
                label="Jam"
                initialScroll
                initialScrollDelay={0}
              />
            </div>
            <span className="special-time-separator" aria-hidden="true">:</span>
            <div className="special-time-wheel-column">
              <span className="special-time-wheel-label">Menit</span>
              <ScrollWheel
                options={MINUTES}
                value={minute}
                onChange={(value) => setMinute(String(value))}
                label="Menit"
                initialScroll
                initialScrollDelay={140}
              />
            </div>
          </div>
          <a className="special-maps-link" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
            Buka Google Maps 
          </a>
          <div className="special-dialog-actions">
            {onRemove && (
              <button type="button" className="special-secondary-button" onClick={() => requestClose(onRemove)}>
                Hapus 
              </button>
            )}
            <button type="button" className="special-secondary-button" onClick={() => requestClose(onCancel)}>Batal</button>
            <button type="submit" className="special-primary-button">Simpan waktu</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const PlaceForm: React.FC<PlaceFormProps> = ({ initialPlace, onCancel, onSave }) => {
  const [mapsUrl, setMapsUrl] = useState(initialPlace?.mapsUrl ?? '');
  const [name, setName] = useState(initialPlace?.name ?? '');
  const [description, setDescription] = useState(initialPlace?.description ?? '');
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const mapsInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    mapsInputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href]'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onCancel]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      if (trimmedName.length > MAX_NAME_LENGTH) {
        throw new Error(`Nama tempat maksimal ${MAX_NAME_LENGTH} karakter.`);
      }
      if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Deskripsi maksimal ${MAX_DESCRIPTION_LENGTH} karakter.`);
      }
      const coordinates = parseGoogleMapsUrl(mapsUrl);
      const saveError = onSave({
        coordinates,
        mapsUrl: mapsUrl.trim(),
        name: trimmedName || 'Tempat pilihan',
        description: trimmedDescription,
      });
      if (saveError) setError(saveError);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Data tempat belum valid.');
    }
  };

  return createPortal(
    <div className="special-modal-backdrop">
      <div
        ref={dialogRef}
        className="special-place-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="special-place-dialog-title"
      >
        <button className="special-dialog-close" type="button" onClick={onCancel} aria-label="Tutup form">
          ×
        </button>
        <p className="special-eyebrow">a little place of your own</p>
        <h3 id="special-place-dialog-title">{initialPlace ? 'Edit tempat' : 'Tambah tempat'}</h3>
        <p className="special-dialog-intro">
         tulis tempat yang pengen kamu datengin, yang belum ada di rekomendasiku
        </p>
        <form className="special-place-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="custom-place-url">Link Google Maps <span aria-hidden="true">*</span></label>
          <input
            ref={mapsInputRef}
            id="custom-place-url"
            type="url"
            value={mapsUrl}
            onChange={(event) => {
              setMapsUrl(event.target.value);
              setError('');
            }}
            placeholder="https://www.google.com/maps?q=-7.5667,110.8167"
            autoComplete="url"
            aria-invalid={Boolean(error)}
            aria-describedby="custom-place-hint custom-place-error"
            required
          />
          <p id="custom-place-hint" className="special-field-hint">
            Tempel link Google Maps untuk menyimpan tempat ini.
          </p>
          <label htmlFor="custom-place-name">Nama tempat</label>
          <input
            id="custom-place-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Contoh: lenopdon"
          />
          <label htmlFor="custom-place-description">Deskripsi <span>(opsional)</span></label>
          <textarea
            id="custom-place-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setError('');
            }}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={3}
            placeholder="mw nyoba krna lewat epyepe"
          />
          <p id="custom-place-error" className="special-form-error" role="alert">
            {error}
          </p>
          <div className="special-dialog-actions">
            <button type="button" className="special-secondary-button" onClick={onCancel}>Batal</button>
            <button type="submit" className="special-primary-button">Simpan tempat</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const SpecialChapter: React.FC<SpecialChapterProps> = ({ wishlistSent, onBack }) => {
  const [places, setPlaces] = useState<CustomPlace[]>([]);
  const [plannedVisits, setPlannedVisits] = useState<PlannedVisit[]>([]);
  const [planningPlaceId, setPlanningPlaceId] = useState<string | null>(null);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [savedPlanSignature, setSavedPlanSignature] = useState('');
  const [planSubmissionError, setPlanSubmissionError] = useState('');
  const [planSubmissionNotice, setPlanSubmissionNotice] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const planVisitRefs = useRef(new Map<string, HTMLTableRowElement>());
  const flyingCardAnimations = useRef(new Map<HTMLElement, Animation>());
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [chapterPhase, setChapterPhase] = useState<
    'waiting' | 'entering' | 'entered' | 'exiting'
  >('waiting');

  const enterTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  useBodyScrollLock(Boolean(planningPlaceId || editingPlaceId || isAddingPlace));

  useEffect(() => {
    if (!wishlistSent) return;

    enterTimerRef.current = window.setTimeout(() => {
      enterTimerRef.current = null;
      setChapterPhase('entering');

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setChapterPhase('entered');
        return;
      }

      enterTimerRef.current = window.setTimeout(() => {
        setChapterPhase('entered');
        enterTimerRef.current = null;
      }, 7600);
    }, 1500);

    return () => {
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
    };
  }, [wishlistSent]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const handleChapterBack = () => {
    if (chapterPhase === 'exiting') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onBack();
      return;
    }

    setChapterPhase('exiting');

    exitTimerRef.current = window.setTimeout(() => {
      onBack();
    }, 1250);
  };

  useEffect(() => () => {
    flyingCardAnimations.current.forEach((animation, card) => {
      animation.cancel();
      card.remove();
    });
    flyingCardAnimations.current.clear();
  }, []);

  const allPlaces = useMemo<MapPlace[]>(
    () => [
      ...specialPlaces.map((place) => ({
        id: place.id,
        name: place.title,
        description: place.description,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        mapsUrl: place.mapsUrl,
      })),
      ...places.map((place) => ({
        ...place,
        name: place.name,
      })),
    ],
    [places]
  );
  const orderedVisits = useMemo(
    () => [...plannedVisits].sort((a, b) => a.time.localeCompare(b.time)),
    [plannedVisits]
  );
  const selectedPlaces = useMemo(
    () => orderedVisits
      .map((visit) => allPlaces.find((place) => place.id === visit.placeId))
      .filter((place): place is MapPlace => place !== undefined),
    [allPlaces, orderedVisits]
  );
  const mappedPlaces = useMemo(
    () => selectedPlaces.filter(
      (place): place is MapPlace & { coordinates: Coordinates } => place.coordinates !== null
    ),
    [selectedPlaces]
  );
  const planPayload = useMemo<PlanSubmissionVisit[]>(
    () => orderedVisits.flatMap((visit) => {
      const place = allPlaces.find((item) => item.id === visit.placeId);
      return place
        ? [{ name: place.name, time: visit.time, mapsUrl: place.mapsUrl }]
        : [];
    }),
    [allPlaces, orderedVisits]
  );
  const planSignature = JSON.stringify(planPayload);
  const isCurrentPlanSaved = planPayload.length > 0 && planSignature === savedPlanSignature;
  const editingPlace = places.find((place) => place.id === editingPlaceId) ?? null;
  const planningPlace = allPlaces.find((place) => place.id === planningPlaceId) ?? null;
  const existingPlanningVisit = planningPlace
    ? plannedVisits.find((visit) => visit.placeId === planningPlace.id)
    : undefined;

  useEffect(() => {
    if (!wishlistSent || !mapContainerRef.current || mapRef.current) return;
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm-raster', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.8, 'raster-brightness-max': 0.96 } }],
      },
      center: [110.82, -7.56],
      zoom: 11,
    });
    mapRef.current = map;
    map.once('load', () => setMapReady(true));
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [wishlistSent]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    markersRef.current.forEach((marker) => marker.remove());
    const homeMarkerElement = document.createElement('div');
    homeMarkerElement.className = 'special-map-home-marker';
    homeMarkerElement.setAttribute('role', 'img');
    homeMarkerElement.setAttribute('aria-label', 'Rumah');
    homeMarkerElement.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/></svg>';
    const homeMarker = new Marker({ element: homeMarkerElement, anchor: 'bottom' })
      .setLngLat([HOME_COORDINATES.longitude, HOME_COORDINATES.latitude])
      .addTo(map);

    const placeMarkers = mappedPlaces.map((place, index) => {
      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'special-map-marker';
      markerElement.innerHTML = `<span>${index + 1}</span>`;
      markerElement.setAttribute('aria-label', `Atur waktu ${place.name}`);
      markerElement.addEventListener('click', () => setPlanningPlaceId(place.id));
      return new Marker({ element: markerElement, anchor: 'bottom' })
        .setLngLat([place.coordinates.longitude, place.coordinates.latitude])
        .addTo(map);
    });
    markersRef.current = [homeMarker, ...placeMarkers];
    const mapLocations = [HOME_COORDINATES, ...mappedPlaces.map((place) => place.coordinates)];
    if (mapLocations.length === 1) {
      map.flyTo({
        center: [HOME_COORDINATES.longitude, HOME_COORDINATES.latitude],
        zoom: 13,
        essential: false,
      });
    } else {
      const bounds = new LngLatBounds();
      mapLocations.forEach((coordinates) => bounds.extend([coordinates.longitude, coordinates.latitude]));
      map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 500 });
    }
  }, [mapReady, mappedPlaces]);


  const closeForm = useCallback(() => {
    setIsAddingPlace(false);
    setEditingPlaceId(null);
  }, []);

  const savePlace = (draft: CustomPlaceDraft): string | null => {
    const duplicate = places.some(
      (place) =>
        place.id !== editingPlaceId &&
        (place.mapsUrl === draft.mapsUrl ||
          (place.coordinates !== null &&
            draft.coordinates !== null &&
            place.coordinates.latitude === draft.coordinates.latitude &&
            place.coordinates.longitude === draft.coordinates.longitude))
    );
    if (duplicate) return 'Tempat dengan koordinat tersebut sudah ada.';

    if (editingPlaceId) {
      setPlaces((current) =>
        current.map((place) => (place.id === editingPlaceId ? { ...draft, id: place.id } : place))
      );
    } else {
      if (places.length >= MAX_CUSTOM_PLACES) return 'Maksimal 3 tempat custom.';
      setPlaces((current) => [...current, { ...draft, id: crypto.randomUUID() }]);
    }
    closeForm();
    return null;
  };

  const deletePlace = (placeId: string) => {
    setPlaces((current) => current.filter((place) => place.id !== placeId));
    setPlannedVisits((current) => current.filter((visit) => visit.placeId !== placeId));
  };

  const closePlanningDialog = useCallback(() => setPlanningPlaceId(null), []);

  const saveVisitTime = (placeId: string, time: string) => {
    setPlannedVisits((current) => {
      const existing = current.find((visit) => visit.placeId === placeId);
      return existing
        ? current.map((visit) => visit.placeId === placeId ? { ...visit, time } : visit)
        : [...current, { placeId, time }];
    });
    closePlanningDialog();
  };

  const removeVisit = (placeId: string) => {
    setPlannedVisits((current) => current.filter((visit) => visit.placeId !== placeId));
    closePlanningDialog();
  };

  const submitPlan = async () => {
    if (isSubmittingPlan || planPayload.length === 0 || isCurrentPlanSaved) return;
    setIsSubmittingPlan(true);
    setPlanSubmissionError('');
    setPlanSubmissionNotice('');
    try {
      const response = await fetch('/api/place-plans', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visits: planPayload }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          result && typeof result === 'object' && typeof (result as { error?: unknown }).error === 'string'
            ? (result as { error: string }).error
            : 'Rencana belum berhasil dikirim. Coba lagi ya.';
        throw new Error(message);
      }
      if (!result || typeof result !== 'object' || (result as { saved?: unknown }).saved !== true) {
        throw new Error('Server belum mengonfirmasi penyimpanan rencana. Coba lagi ya.');
      }
      setSavedPlanSignature(planSignature);
      setPlanSubmissionNotice('Rencana kita udah kusimpan, sampe besokkk');
      throwPlanCardsIntoClock(orderedVisits);
    } catch (submissionError) {
      setPlanSubmissionError(
        submissionError instanceof Error ? submissionError.message : 'Rencana belum berhasil dikirim. Coba lagi ya.'
      );
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const throwPlanCardsIntoClock = (visits: PlannedVisit[]) => {
    const clock = clockRef.current;
    if (
      !clock ||
      typeof Element.prototype.animate !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const clockRect = clock.getBoundingClientRect();
    const targetX = clockRect.left + clockRect.width / 2;
    const targetY = clockRect.top + clockRect.height / 2;

    visits.forEach((visit, index) => {
      const source = planVisitRefs.current.get(visit.placeId);
      const place = allPlaces.find((item) => item.id === visit.placeId);
      if (!source || !place) return;

      const sourceRect = source.getBoundingClientRect();
      const card = document.createElement('div');
      card.className = 'special-clock-flight';
      card.setAttribute('aria-hidden', 'true');
      card.inert = true;

      const name = document.createElement('strong');
      name.textContent = place.name;
      const time = document.createElement('span');
      time.textContent = visit.time;
      card.append(name, time);
      Object.assign(card.style, {
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`,
      });
      document.body.append(card);

      const deltaX = targetX - (sourceRect.left + sourceRect.width / 2);
      const deltaY = targetY - (sourceRect.top + sourceRect.height / 2);
      const animation = card.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          {
            transform: `translate(${deltaX * 0.55}px, ${deltaY * 0.55 - 36}px) rotate(8deg) scale(0.82)`,
            opacity: 0.95,
            offset: 0.55,
          },
          { transform: `translate(${deltaX}px, ${deltaY}px) rotate(-8deg) scale(0.12)`, opacity: 0 },
        ],
        {
          duration: 720,
          delay: index * 120,
          easing: 'cubic-bezier(0.2, 0.7, 0.25, 1)',
          fill: 'forwards',
        }
      );

      const removeCard = () => {
        flyingCardAnimations.current.delete(card);
        card.remove();
      };
      flyingCardAnimations.current.set(card, animation);
      animation.addEventListener('finish', removeCard, { once: true });
      animation.addEventListener('cancel', removeCard, { once: true });
    });
  };

  const visitWarnings: string[] = [];
  orderedVisits.forEach((visit, index) => {
    if (orderedVisits.some((other, otherIndex) => otherIndex < index && other.time === visit.time)) {
      visitWarnings.push(`Ada waktu yang bentrok pada ${visit.time}.`);
    }
    const nextVisit = orderedVisits[index + 1];
    if (!nextVisit) return;
    const from = allPlaces.find((place) => place.id === visit.placeId);
    const to = allPlaces.find((place) => place.id === nextVisit.placeId);
    if (!from?.coordinates || !to?.coordinates) return;
    const gapMinutes = (Number(nextVisit.time.slice(0, 2)) * 60 + Number(nextVisit.time.slice(3))) -
      (Number(visit.time.slice(0, 2)) * 60 + Number(visit.time.slice(3)));
    const estimatedMinutes = Math.ceil(haversineDistance(from.coordinates, to.coordinates) / (30_000 / 60));
    if (gapMinutes >= 0 && gapMinutes < estimatedMinutes) {
      visitWarnings.push(
        `Perjalanan dari ${from.name} ke ${to.name} mungkin tidak cukup: estimasi garis lurus minimal ${estimatedMinutes} menit.`
      );
    }
  });

  if (!wishlistSent) return null;

  return (
    <section
        className={`special-chapter special-chapter--${chapterPhase}`}
        aria-labelledby="special-chapter-title"
        >

      <header className="special-chapter-heading">
        <h2 id="special-chapter-title">
          <AnimatedText text="Special Chapter" />
        </h2>
        <p>
          <AnimatedText text={'pilih dan tentukan jam nya yaa, mwehehehe gabisa "ngikut"'} delay={260} interval={16} />
        </p>
      </header>

      <section className="special-defaults" aria-labelledby="special-defaults-title">
        <div className="special-section-heading">
          <div>
            <h3 id="special-defaults-title">
              <AnimatedText text="Rekomendasiku" />
            </h3>
            <h4 id="special-defaults-subtittle">
              <AnimatedText text="btw ini banyak yang belum kucoba hhee, mayoritas cuman liat dari fyp" delay={180} interval={14} />
            </h4>
          </div>
          <span className="special-placeholder-count">8 saran</span>
        </div>
        <div className="special-default-grid">
          {specialPlaces.map((place, index) => {
            const visit = plannedVisits.find((item) => item.placeId === place.id);
            return (
              <article
                className={`special-custom-card ${visit ? 'is-selected' : ''}`}
                key={place.id}
                style={{ '--card-delay': `${index * 100}ms` } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="special-card-select"
                  aria-pressed={Boolean(visit)}
                  onClick={() => setPlanningPlaceId(place.id)}
                >
                  <span className="special-placeholder-number">0{index + 1}</span>
                  <span className="special-card-heart" aria-hidden="true">
                    <svg viewBox="0 0 32 32" focusable="false">
                      <path d="M16 27S4.5 20.3 4.5 11.7C4.5 7.8 7.2 5 10.8 5c2.2 0 4.2 1.1 5.2 2.9C17 6.1 19 5 21.2 5c3.6 0 6.3 2.8 6.3 6.7C27.5 20.3 16 27 16 27Z" />
                      {visit && <path className="special-card-check" d="m10.7 15.7 3.2 3.1 7-7" />}
                    </svg>
                  </span>
                  <h4>{place.title}</h4>
                  <p>{place.description}</p>
                  <span className="special-custom-badge">{visit ? `Direncanakan · ${visit.time}` : 'Rekomendasi'}</span>
                </button>
                <a
                  className="special-maps-link"
                  href={place.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buka link Google
                </a>
              </article>
            );
          })}
        
        </div>
      </section>

      <section className="special-custom-section" aria-labelledby="special-custom-title">
        <div className="special-section-heading">
          <div>
            <h3 id="special-custom-title">
              <AnimatedText text="Custom place" />
            </h3>
          <div></div>
            <h4 id="special-custom-title">
              <AnimatedText text="klo kmu punya plan tempat yang pengen kmu datengin tulis aja disini" delay={180} interval={14} />
            </h4>
          </div>
          <span className="special-placeholder-count">{places.length}/{MAX_CUSTOM_PLACES} tempat</span>
        </div>
        <div className="special-custom-grid">
          {places.map((place, index) => {
            const visit = plannedVisits.find((item) => item.placeId === place.id);
            const isSelected = Boolean(visit);
            return (
              <article
                className={`special-custom-card ${isSelected ? 'is-selected' : ''}`}
                key={place.id}
                style={{ '--card-delay': `${index * 100}ms` } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="special-card-select"
                  aria-pressed={isSelected}
                  onClick={() => setPlanningPlaceId(place.id)}
                >
                  <span className="special-card-heart" aria-hidden="true">
                    <svg viewBox="0 0 32 32" focusable="false">
                      <path d="M16 27S4.5 20.3 4.5 11.7C4.5 7.8 7.2 5 10.8 5c2.2 0 4.2 1.1 5.2 2.9C17 6.1 19 5 21.2 5c3.6 0 6.3 2.8 6.3 6.7C27.5 20.3 16 27 16 27Z" />
                      {isSelected && <path className="special-card-check" d="m10.7 15.7 3.2 3.1 7-7" />}
                    </svg>
                  </span>
                  <h4>{place.name}</h4>
                  {place.description && <p>{place.description}</p>}
                  <span className="special-custom-badge">
                    {visit ? `Direncanakan · ${visit.time}` : 'Custom Place · klik untuk atur waktu'}
                  </span>
                </button>
                <a className="special-maps-link" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
                  Buka Google Maps
                </a>
                <div className="special-card-actions">
                  <button type="button" onClick={() => setEditingPlaceId(place.id)}>Edit</button>
                  <button type="button" onClick={() => deletePlace(place.id)}>Hapus</button>
                  {visit && <button type="button" onClick={() => setPlanningPlaceId(place.id)}>Atur waktu</button>}
                </div>
              </article>
            );
          })}
          {getProgressiveEmptyCardCount(places.length) > 0 && (
            <button
              type="button"
              className="special-empty-card"
              style={{ '--card-delay': `${places.length * 100}ms` } as React.CSSProperties}
              onClick={() => setIsAddingPlace(true)}
            >
              <span aria-hidden="true">＋</span>
              <strong>Tambah tempat</strong>
              <small>Tambahkan dari Google Maps</small>
            </button>
          )}
        </div>
      </section>

      <section className="special-map-planning">
        <div className="special-map-panel">
          <div className="special-section-heading">
            <div>
            <h3><AnimatedText text="Our Map" /></h3>
            <h4 id="special-defaults-subtittle">
              <AnimatedText text="btw saranku liat jaraknnya juga yaa, biar gk kejauhan" delay={160} interval={14} />
            </h4>
            </div>
          </div>
          <div ref={mapContainerRef} className="special-map" aria-label="Peta OpenStreetMap tempat yang direncanakan" />
        </div>

        <div className="special-plan-panel">
          <div className="special-section-heading">
            <div>
              <h3><AnimatedText text="Our Plan" /></h3>
            </div>
          </div>
          <div ref={clockRef} className="special-clock" role="group" aria-label="Jam analog tempat yang direncanakan">
            <span className="special-clock-center" />
            {orderedVisits.map((visit) => {
              const minuteOfDay = Number(visit.time.slice(0, 2)) * 60 + Number(visit.time.slice(3));
              const angle = (minuteOfDay / (12 * 60)) * Math.PI * 2 - Math.PI / 2;
              const place = allPlaces.find((item) => item.id === visit.placeId);
              if (!place) return null;
              return (
                <button
                  key={visit.placeId}
                  className="special-clock-dot"
                  type="button"
                  title={`${place.name} · ${visit.time}`}
                  aria-label={`Atur waktu ${place.name}, saat ini ${visit.time}`}
                  onClick={() => setPlanningPlaceId(place.id)}
                  style={{ left: `${50 + Math.cos(angle) * 39}%`, top: `${50 + Math.sin(angle) * 39}%` }}
                >
                  {visit.time}
                </button>
              );
            })}
            <span className="special-clock-label special-clock-label--12">12</span>
            <span className="special-clock-label special-clock-label--3">3</span>
            <span className="special-clock-label special-clock-label--6">6</span>
            <span className="special-clock-label special-clock-label--9">9</span>
          </div>
          {orderedVisits.length === 0 ? (
            <p className="special-empty-plan">Pilih tempat untuk mulai.</p>
          ) : (
            <div className="special-plan-table-wrap">
              <table className="special-plan-table" aria-label="Rencana kunjungan">
                <thead>
                  <tr>
                    <th scope="col">Tempat</th>
                    <th scope="col">Waktu</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedVisits.map((visit) => {
                    const place = allPlaces.find((item) => item.id === visit.placeId);
                    if (!place) return null;
                    return (
                      <tr
                        key={visit.placeId}
                        ref={(element) => {
                          if (element) {
                            planVisitRefs.current.set(visit.placeId, element);
                          } else {
                            planVisitRefs.current.delete(visit.placeId);
                          }
                        }}
                      >
                        <td>
                          <span className="special-plan-place">
                            {place.name}
                          </span>
                        </td>
                        <td>
                          <span className="special-plan-time">{visit.time}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="special-remove-plan"
                            onClick={() => removeVisit(visit.placeId)}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {visitWarnings.length > 0 && (
            <ul className="special-plan-warnings" aria-label="Peringatan waktu">
              {[...new Set(visitWarnings)].map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          )}
          {planSubmissionError && <p className="special-plan-submit-feedback is-error" role="alert">{planSubmissionError}</p>}
          {planSubmissionNotice && (
            <p className="special-plan-submit-feedback" role="status">{planSubmissionNotice}</p>
          )}
          <button
            type="button"
            className="special-save-plan-button"
            onClick={() => void submitPlan()}
            disabled={planPayload.length === 0 || isSubmittingPlan || isCurrentPlanSaved}
          >
            {isSubmittingPlan
              ? 'MENGIRIM RENCANA...'
              : isCurrentPlanSaved
                ? 'RENCANA TERKIRIM'
                : 'SIMPAN RENCANA'}
          </button>
          {isCurrentPlanSaved && (
            <button
              type="button"
              className="special-return-button"
              onClick={handleChapterBack}
              disabled={chapterPhase === 'exiting'}
            >
              KEMBALI KE AWAL
            </button>
          )}
        </div>
      </section>

      {(isAddingPlace || editingPlace) && (
        <PlaceForm
          key={editingPlace?.id ?? 'new'}
          initialPlace={editingPlace}
          onCancel={closeForm}
          onSave={savePlace}
        />
      )}
      {planningPlace && (
        <PlanTimeDialog
          key={planningPlace.id}
          place={planningPlace}
          initialTime={existingPlanningVisit?.time ?? '00:00'}
          onCancel={closePlanningDialog}
          onSave={(time) => saveVisitTime(planningPlace.id, time)}
          onRemove={existingPlanningVisit ? () => removeVisit(planningPlace.id) : undefined}
        />
      )}
    </section>
  );
};
