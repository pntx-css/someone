import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, Popup, setWorkerUrl } from 'maplibre-gl';
import type { Feature, LineString } from 'geojson';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import {
  getProgressiveEmptyCardCount,
  MAX_CUSTOM_PLACES,
  parseGoogleMapsUrl,
  type Coordinates,
  type CustomPlaceDraft,
} from '../data/customPlace';
import { specialPlaces, specialPlacePlaceholders } from '../data/specialPlaces';
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

interface RouteInfo {
  placeIds: string[];
  status: 'routed' | 'fallback';
  geometry: Feature<LineString> | null;
  distanceMeters: number;
  durationSeconds: number | null;
}

interface SpecialChapterProps {
  wishlistSent: boolean;
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

const formatDistance = (meters: number): string =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

const formatDuration = (seconds: number): string => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} menit`;
};

const createPopup = (place: MapPlace, plannedTime?: string): HTMLElement => {
  const content = document.createElement('div');
  content.className = 'special-map-popup';
  const title = document.createElement('strong');
  title.textContent = place.name;
  content.append(title);
  if (place.description) {
    const description = document.createElement('p');
    description.textContent = place.description;
    content.append(description);
  }
  if (plannedTime) {
    const time = document.createElement('p');
    time.textContent = `Waktu kunjungan: ${plannedTime}`;
    content.append(time);
  }
  const link = document.createElement('a');
  link.href = place.mapsUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Buka Google Maps';
  content.append(link);
  return content;
};

const PlanTimeDialog: React.FC<PlanTimeDialogProps> = ({
  place,
  initialTime,
  onCancel,
  onSave,
  onRemove,
}) => {
  const [time, setTime] = useState(initialTime);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    timeInputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not(:disabled), button:not(:disabled), a[href]'
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
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
    onSave(time);
  };

  return (
    <div
      className="special-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="special-place-dialog special-time-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="special-time-dialog-title"
      >
        <button className="special-dialog-close" type="button" onClick={onCancel} aria-label="Tutup pengaturan waktu">
          ×
        </button>
        <p className="special-eyebrow">a little time for us</p>
        <h3 id="special-time-dialog-title">Atur waktu kunjungan</h3>
        <p className="special-dialog-intro">
          {place.name}{place.description && place.description !== place.name ? ` · ${place.description}` : ''}
        </p>
        <form className="special-place-form" onSubmit={handleSubmit}>
          <label htmlFor="planned-visit-time">Waktu</label>
          <input ref={timeInputRef} id="planned-visit-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
          <a className="special-maps-link" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
            Buka Google Maps ↗
          </a>
          <div className="special-dialog-actions">
            {onRemove && (
              <button type="button" className="special-secondary-button" onClick={onRemove}>
                Hapus dari rencana
              </button>
            )}
            <button type="button" className="special-secondary-button" onClick={onCancel}>Batal</button>
            <button type="submit" className="special-primary-button">Simpan waktu</button>
          </div>
        </form>
      </div>
    </div>
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
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
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

  return (
    <div className="special-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
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
          Tempat tersimpan sementara di halaman ini dan akan hilang saat halaman dimuat ulang.
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
            Link HTTPS Google Maps, termasuk link pendek, bisa digunakan. Marker dan rute tersedia jika link memuat koordinat.
          </p>
          <label htmlFor="custom-place-name">Nama tempat <span>(opsional)</span></label>
          <input
            id="custom-place-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Contoh: tempat favorit kita"
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
            placeholder="Kenapa tempat ini spesial?"
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
    </div>
  );
};

export const SpecialChapter: React.FC<SpecialChapterProps> = ({ wishlistSent }) => {
  const [places, setPlaces] = useState<CustomPlace[]>([]);
  const [plannedVisits, setPlannedVisits] = useState<PlannedVisit[]>([]);
  const [planningPlaceId, setPlanningPlaceId] = useState<string | null>(null);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [savedPlanSignature, setSavedPlanSignature] = useState('');
  const [planSubmissionError, setPlanSubmissionError] = useState('');
  const [planSubmissionNotice, setPlanSubmissionNotice] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const allPlaces = useMemo<MapPlace[]>(
    () => [
      ...specialPlaces.map((place) => ({
        id: place.id,
        name: place.title,
        description: place.description,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        mapsUrl: `https://www.google.com/maps?q=${place.latitude},${place.longitude}`,
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
  const activeRoute = route?.placeIds.length === mappedPlaces.length &&
    route.placeIds.every((placeId, index) => placeId === mappedPlaces[index]?.id)
    ? route
    : null;
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
        layers: [{ id: 'osm-raster', type: 'raster', source: 'osm' }],
      },
      center: [110.82, -7.56],
      zoom: 11,
      minZoom: 10,
      maxZoom: 17,
      maxBounds: [
        [110.65, -7.75],
        [111.05, -7.42],
      ],
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
    if (mappedPlaces.length < 2) {
      return;
    }

    const fallbackDistance = mappedPlaces.slice(1).reduce(
      (total, place, index) => total + haversineDistance(mappedPlaces[index].coordinates, place.coordinates),
      0
    );
    const controller = new AbortController();
    const coordinates = mappedPlaces
      .map(({ coordinates: placeCoordinates }) => `${placeCoordinates.longitude},${placeCoordinates.latitude}`)
      .join(';');
    const placeIds = mappedPlaces.map(({ id }) => id);

    void fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('Routing service tidak tersedia.');
        const result: unknown = await response.json();
        if (!result || typeof result !== 'object') throw new Error('Respons routing tidak valid.');
        const routes = (result as { routes?: unknown }).routes;
        if (!Array.isArray(routes) || !routes[0] || typeof routes[0] !== 'object') {
          throw new Error('Rute tidak ditemukan.');
        }
        const firstRoute = routes[0] as {
          distance?: unknown;
          duration?: unknown;
          geometry?: unknown;
        };
        const geometry = firstRoute.geometry as Feature<LineString> | undefined;
        if (
          typeof firstRoute.distance !== 'number' ||
          typeof firstRoute.duration !== 'number' ||
          !geometry ||
          geometry.type !== 'Feature' ||
          geometry.geometry?.type !== 'LineString'
        ) {
          throw new Error('Data rute tidak lengkap.');
        }
        if (controller.signal.aborted) return;
        setRoute({
          placeIds,
          status: 'routed',
          geometry,
          distanceMeters: firstRoute.distance,
          durationSeconds: firstRoute.duration,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRoute({
            placeIds,
            status: 'fallback',
            geometry: null,
            distanceMeters: fallbackDistance,
            durationSeconds: null,
          });
        }
      });
    return () => controller.abort();
  }, [mappedPlaces]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = mappedPlaces.map((place) => {
      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'special-map-marker';
      markerElement.setAttribute('aria-label', `Lihat ${place.name} di peta`);
      markerElement.dataset.placeId = place.id;
      return new Marker({ element: markerElement, anchor: 'bottom' })
        .setLngLat([place.coordinates.longitude, place.coordinates.latitude])
        .setPopup(
          new Popup({ offset: 24 }).setDOMContent(
            createPopup(place, plannedVisits.find((visit) => visit.placeId === place.id)?.time)
          )
        )
        .addTo(map);
    });

    if (mappedPlaces.length === 1) {
      const [place] = mappedPlaces;
      map.flyTo({
        center: [place.coordinates.longitude, place.coordinates.latitude],
        zoom: 13,
        essential: false,
      });
    } else if (mappedPlaces.length > 1) {
      const bounds = new LngLatBounds();
      mappedPlaces.forEach(({ coordinates: placeCoordinates }) =>
        bounds.extend([placeCoordinates.longitude, placeCoordinates.latitude])
      );
      map.fitBounds(bounds, { padding: 64, maxZoom: 13, duration: 500 });
    }

    const sourceId = 'custom-place-route';
    const layerId = 'custom-place-route-line';
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (activeRoute?.status === 'routed' && activeRoute.geometry) {
      map.addSource(sourceId, { type: 'geojson', data: activeRoute.geometry });
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': '#c24578', 'line-width': 4, 'line-opacity': 0.82 },
      });
    }
  }, [activeRoute, mapReady, mappedPlaces, plannedVisits]);

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
      setRoute(null);
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
    setRoute(null);
  };

  const closePlanningDialog = useCallback(() => setPlanningPlaceId(null), []);

  const saveVisitTime = (placeId: string, time: string) => {
    setPlannedVisits((current) => {
      const existing = current.find((visit) => visit.placeId === placeId);
      return existing
        ? current.map((visit) => visit.placeId === placeId ? { ...visit, time } : visit)
        : [...current, { placeId, time }];
    });
    setRoute(null);
    closePlanningDialog();
  };

  const removeVisit = (placeId: string) => {
    setPlannedVisits((current) => current.filter((visit) => visit.placeId !== placeId));
    setRoute(null);
    closePlanningDialog();
  };

  const updateVisitTime = (placeId: string, time: string) => {
    setPlannedVisits((current) =>
      current.map((visit) => (visit.placeId === placeId ? { ...visit, time } : visit))
    );
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
      setPlanSubmissionNotice('Rencana berhasil dikirim ke dashboard admin.');
    } catch (submissionError) {
      setPlanSubmissionError(
        submissionError instanceof Error ? submissionError.message : 'Rencana belum berhasil dikirim. Coba lagi ya.'
      );
    } finally {
      setIsSubmittingPlan(false);
    }
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
    <section className="special-chapter" aria-labelledby="special-chapter-title">
      <header className="special-chapter-heading">
        <p className="special-eyebrow">our little places</p>
        <h2 id="special-chapter-title">Special Chapter</h2>
        <p>Pilih tempat rekomendasi atau simpan tempat pilihanmu sendiri untuk hari kecil kita.</p>
      </header>

      <section className="special-defaults" aria-labelledby="special-defaults-title">
        <div className="special-section-heading">
          <div>
            <p className="special-eyebrow">little places to discover</p>
            <h3 id="special-defaults-title">Tempat pilihan</h3>
          </div>
          <span className="special-placeholder-count">3 tempat pilihan · klik kartu untuk atur waktu</span>
        </div>
        <div className="special-default-grid">
          {specialPlaces.map((place, index) => {
            const visit = plannedVisits.find((item) => item.placeId === place.id);
            return (
              <article className={`special-custom-card ${visit ? 'is-selected' : ''}`} key={place.id}>
                <button
                  type="button"
                  className="special-card-select"
                  aria-pressed={Boolean(visit)}
                  onClick={() => setPlanningPlaceId(place.id)}
                >
                  <span className="special-placeholder-number">0{index + 1}</span>
                  <span className="special-card-heart" aria-hidden="true">{visit ? '✓' : '♡'}</span>
                  <h4>{place.title}</h4>
                  <p>{place.description}</p>
                  <span className="special-custom-badge">{visit ? `Direncanakan · ${visit.time}` : 'Tempat pilihan'}</span>
                </button>
                <a
                  className="special-maps-link"
                  href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buka Google Maps ↗
                </a>
              </article>
            );
          })}
          {specialPlacePlaceholders.map((place, index) => (
            <article className="special-placeholder-card" key={place.id}>
              <span className="special-placeholder-number">0{index + specialPlaces.length + 1}</span>
              <span className="special-placeholder-art" aria-hidden="true">♡</span>
              <h4>{place.title}</h4>
              <p>Detail tempat akan ditambahkan.</p>
              <span className="special-coming-soon">PLACEHOLDER</span>
            </article>
          ))}
        </div>
      </section>

      <section className="special-custom-section" aria-labelledby="special-custom-title">
        <div className="special-section-heading">
          <div>
            <p className="special-eyebrow">your own little discoveries</p>
            <h3 id="special-custom-title">Tempat custom</h3>
          </div>
          <span className="special-placeholder-count">{places.length}/{MAX_CUSTOM_PLACES} tempat</span>
        </div>
        <p className="special-section-note">
          Tempat custom hanya tersimpan di memori halaman ini dan tidak disimpan ke akun. Saat beberapa tempat dipilih,
          koordinatnya dikirim ke layanan routing OSRM publik untuk mencari rute. Peta memuat tile OpenStreetMap.
        </p>
        <div className="special-custom-grid">
          {places.map((place) => {
            const visit = plannedVisits.find((item) => item.placeId === place.id);
            const isSelected = Boolean(visit);
            return (
              <article className={`special-custom-card ${isSelected ? 'is-selected' : ''}`} key={place.id}>
                <button
                  type="button"
                  className="special-card-select"
                  aria-pressed={isSelected}
                  onClick={() => setPlanningPlaceId(place.id)}
                >
                  <span className="special-card-heart" aria-hidden="true">{isSelected ? '✓' : '♡'}</span>
                  <h4>{place.name}</h4>
                  {place.description && <p>{place.description}</p>}
                  <span className="special-custom-badge">
                    {visit ? `Direncanakan · ${visit.time}` : 'Custom Place · klik untuk atur waktu'}
                  </span>
                </button>
                <a className="special-maps-link" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
                  Buka Google Maps ↗
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
              <p className="special-eyebrow">a map for us</p>
              <h3>Peta tempat pilihan</h3>
            </div>
          </div>
          <div ref={mapContainerRef} className="special-map" aria-label="Peta tempat custom pilihan" />
          <p className="special-route-status" aria-live="polite">
            {selectedPlaces.length === 0 && 'Pilih kartu tempat untuk melihatnya di peta.'}
            {mappedPlaces.length === 0 && selectedPlaces.length > 0 &&
              'Link tempat yang dipilih tidak memuat koordinat, jadi tidak bisa ditampilkan di peta.'}
            {mappedPlaces.length === 1 && 'Pilih tempat lain dengan koordinat untuk melihat rute antar-tempat.'}
            {mappedPlaces.length > 1 && !activeRoute && 'Mencari rute jalan...'}
            {mappedPlaces.length > 1 && activeRoute?.status === 'routed' &&
              `Rute OSRM: ${formatDistance(activeRoute.distanceMeters)} · sekitar ${formatDuration(activeRoute.durationSeconds ?? 0)}.`}
            {mappedPlaces.length > 1 && activeRoute?.status === 'fallback' &&
              `Rute jalan tidak tersedia. Perkiraan jarak garis lurus: ${formatDistance(activeRoute.distanceMeters)}.`}
            {mappedPlaces.length < selectedPlaces.length && mappedPlaces.length > 0 &&
              ' Beberapa tempat tidak ditampilkan karena link-nya tidak memuat koordinat.'}
          </p>
        </div>

        <div className="special-plan-panel">
          <div className="special-section-heading">
            <div>
              <p className="special-eyebrow">make a little memory</p>
              <h3>Our Little Plan</h3>
            </div>
          </div>
          <div className="special-clock" role="group" aria-label="Jam analog tempat yang direncanakan">
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
            <p className="special-empty-plan">Klik kartu tempat pilihan atau custom untuk menambahkan waktu kunjungan.</p>
          ) : (
            <ol className="special-plan-list">
              {orderedVisits.map((visit) => {
                const place = allPlaces.find((item) => item.id === visit.placeId);
                if (!place) return null;
                return (
                  <li key={visit.placeId}>
                    <button
                      type="button"
                      className="special-plan-place"
                      onClick={() => setPlanningPlaceId(place.id)}
                    >
                      {place.name}
                    </button>
                    <label className="special-time-label">
                      <span className="sr-only">Waktu untuk {place.name}</span>
                      <input
                        type="time"
                        value={visit.time}
                        onChange={(event) => updateVisitTime(visit.placeId, event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className="special-remove-plan"
                      onClick={() => removeVisit(visit.placeId)}
                    >
                      Hapus
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          {visitWarnings.length > 0 && (
            <ul className="special-plan-warnings" aria-label="Peringatan waktu">
              {[...new Set(visitWarnings)].map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          )}
          <p className="special-plan-disclaimer">
            Saat disimpan, nama tempat, waktu, dan link Google Maps dikirim ke dashboard admin. Data tersimpan sampai admin menghapusnya.
          </p>
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
          <p className="special-plan-disclaimer">
            Rencana akan tersimpan di dashboard admin sampai admin menghapusnya. Estimasi perjalanan memakai jarak garis lurus dan kecepatan rata-rata; kondisi jalan dapat berbeda.
          </p>
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
          initialTime={existingPlanningVisit?.time ?? '09:00'}
          onCancel={closePlanningDialog}
          onSave={(time) => saveVisitTime(planningPlace.id, time)}
          onRemove={existingPlanningVisit ? () => removeVisit(planningPlace.id) : undefined}
        />
      )}
    </section>
  );
};
