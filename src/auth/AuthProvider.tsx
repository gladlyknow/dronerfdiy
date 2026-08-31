import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { authClient, type AuthSession, type AuthUser } from './client';
import {
  apiRequest,
  type ApiRequestOptions,
  type ResourceType,
} from './api';

type SyncState = 'idle' | 'syncing' | 'synced' | 'error';
type Level = 'A' | 'B' | 'C';

type ActivityInput = {
  resourceType: ResourceType;
  resourceId: string;
  kind: 'view' | 'watch';
  positionSeconds: number;
  totalSeconds: number;
  completed?: boolean;
  countView?: boolean;
};

type ImportFavorite = {
  resourceType: ResourceType;
  resourceId: string;
};

type ImportWrongQuestion = {
  questionId: string;
  level: Level;
};

type ImportPayload = {
  deviceId: string;
  payloadVersion: '1';
  digest: string;
  favorites: ImportFavorite[];
  wrongQuestions: ImportWrongQuestion[];
};

type FavoriteRecord = {
  resource_type: ResourceType;
  resource_id: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession['session'] | null;
  isPending: boolean;
  syncState: SyncState;
  syncMessage: string;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
  apiRequest: <T>(path: string, options?: ApiRequestOptions) => Promise<T>;
  setFavorite: (resourceType: ResourceType, resourceId: string, favorited: boolean) => Promise<boolean>;
  recordActivity: (input: ActivityInput) => Promise<boolean>;
  saveProgress: (resourceType: ResourceType, resourceId: string, progress: number) => Promise<boolean>;
  markQuestionMastered: (level: Level, questionId: string, isMastered: boolean) => Promise<boolean>;
  clearWrongQuestions: (level: Level) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const levels: Level[] = ['A', 'B', 'C'];
const resourceTypes = new Set<ResourceType>(['question', 'knowledge', 'drone_article', 'video', 'tool']);
const encoder = new TextEncoder();

const isBoundedId = (value: unknown, maximum = 160): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= maximum;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readArray = (key: string): unknown[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const sortedIds = (values: Iterable<string>): string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const readDeviceId = (): string | null => {
  const key = 'dronerf_device_id';
  try {
    const current = localStorage.getItem(key);
    if (typeof current === 'string' && /^[0-9a-f-]{36}$/i.test(current)) return current;
    const next = crypto.randomUUID();
    localStorage.setItem(key, next);
    return next;
  } catch {
    return null;
  }
};

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
};

const gatherLocalData = async (): Promise<ImportPayload | null> => {
  const deviceId = readDeviceId();
  if (!deviceId) return null;
  const favorites = new Map<string, ImportFavorite>();
  const knowledge = readArray('ham_a_bookmarks')
    .filter((value): value is string => isBoundedId(value));
  for (const resourceId of sortedIds(knowledge).slice(0, 5_000)) {
    favorites.set(`knowledge:${resourceId}`, { resourceType: 'knowledge', resourceId });
  }
  for (const level of levels) {
    const ids = readArray(`ham_favs_${level}`)
      .filter((value): value is string => isBoundedId(value, 157));
    for (const id of sortedIds(ids).slice(0, 5_000)) {
      const resourceId = `${level}:${id}`;
      favorites.set(`question:${resourceId}`, { resourceType: 'question', resourceId });
    }
  }
  const wrongQuestions = new Map<string, ImportWrongQuestion>();
  for (const level of levels) {
    const questions = readArray(`ham_wrong_questions_${level}`);
    for (const value of questions) {
      if (!isRecord(value) || !isBoundedId(value.id)) continue;
      wrongQuestions.set(`${level}:${value.id}`, { level, questionId: value.id });
      if (wrongQuestions.size >= 5_000) break;
    }
  }
  const canonical = {
    deviceId,
    payloadVersion: '1' as const,
    favorites: [...favorites.values()].sort((left, right) => (
      `${left.resourceType}:${left.resourceId}`.localeCompare(`${right.resourceType}:${right.resourceId}`)
    )),
    wrongQuestions: [...wrongQuestions.values()].sort((left, right) => (
      `${left.level}:${left.questionId}`.localeCompare(`${right.level}:${right.questionId}`)
    )),
  };
  const digest = await sha256Hex(JSON.stringify(canonical));
  return { ...canonical, digest };
};

const writeMergedFavorites = (favorites: FavoriteRecord[]): void => {
  const localKnowledge = readArray('ham_a_bookmarks')
    .filter((value): value is string => isBoundedId(value));
  const localQuestions = new Map<Level, string[]>();
  for (const level of levels) {
    localQuestions.set(level, readArray(`ham_favs_${level}`)
      .filter((value): value is string => isBoundedId(value, 157)));
  }
  for (const favorite of favorites) {
    if (!resourceTypes.has(favorite.resource_type) || !isBoundedId(favorite.resource_id)) continue;
    if (favorite.resource_type === 'knowledge') localKnowledge.push(favorite.resource_id);
    if (favorite.resource_type === 'question') {
      const match = favorite.resource_id.match(/^([ABC]):(.+)$/);
      if (match && isBoundedId(match[2], 157)) {
        const level = match[1] as Level;
        localQuestions.get(level)?.push(match[2]);
      }
    }
  }
  try {
    localStorage.setItem('ham_a_bookmarks', JSON.stringify(sortedIds(localKnowledge)));
    for (const level of levels) {
      localStorage.setItem(`ham_favs_${level}`, JSON.stringify(sortedIds(localQuestions.get(level) ?? [])));
    }
    window.dispatchEvent(new CustomEvent('dronerf:cloud-sync'));
  } catch {
    // A disabled localStorage must not affect normal local use.
  }
};

export function AuthProvider({ children }: PropsWithChildren) {
  const { data, isPending, refetch } = authClient.useSession();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const signOut = useCallback(async () => {
    await authClient.signOut();
    await refetch();
  }, [refetch]);

  const safelyWrite = useCallback(async (operation: () => Promise<unknown>): Promise<boolean> => {
    try {
      await operation();
      return true;
    } catch {
      return false;
    }
  }, []);

  const setFavorite = useCallback((resourceType: ResourceType, resourceId: string, favorited: boolean) =>
    safelyWrite(() => apiRequest(
      `/api/v1/favorites/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`,
      { method: favorited ? 'PUT' : 'DELETE' },
    )), [safelyWrite]);

  const recordActivity = useCallback((input: ActivityInput) =>
    safelyWrite(() => apiRequest('/api/v1/activities', { method: 'POST', body: input })), [safelyWrite]);

  const saveProgress = useCallback((resourceType: ResourceType, resourceId: string, progress: number) =>
    safelyWrite(() => apiRequest(
      `/api/v1/progress/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`,
      { method: 'PUT', body: { progress } },
    )), [safelyWrite]);

  const markQuestionMastered = useCallback((level: Level, questionId: string, isMastered: boolean) =>
    safelyWrite(() => apiRequest(
      `/api/v1/mastery/${level}/${encodeURIComponent(questionId)}`,
      { method: 'PUT', body: { isMastered } },
    )), [safelyWrite]);

  const clearWrongQuestions = useCallback((level: Level) =>
    safelyWrite(() => apiRequest(`/api/v1/mastery/${level}/clear-wrong`, { method: 'POST' })), [safelyWrite]);

  useEffect(() => {
    if (!data?.user) {
      setSyncState('idle');
      setSyncMessage('');
      return;
    }
    let cancelled = false;
    const synchronize = async () => {
      setSyncState('syncing');
      setSyncMessage('正在合并本地记录…');
      try {
        const payload = await gatherLocalData();
        if (!payload) throw new Error('Local storage is unavailable.');
        await apiRequest('/api/v1/import/local', { method: 'POST', body: payload });
        const favorites = await apiRequest<FavoriteRecord[]>('/api/v1/favorites');
        if (cancelled) return;
        writeMergedFavorites(favorites);
        setSyncState('synced');
        setSyncMessage('云端已同步');
      } catch {
        if (!cancelled) {
          setSyncState('error');
          setSyncMessage('同步失败，本地记录仍可使用');
        }
      }
    };
    void synchronize();
    return () => { cancelled = true; };
  }, [data?.user?.id]);

  const value = useMemo<AuthContextValue>(() => ({
    user: data?.user ?? null,
    session: data?.session ?? null,
    isPending,
    syncState,
    syncMessage,
    refetch,
    signOut,
    apiRequest,
    setFavorite,
    recordActivity,
    saveProgress,
    markQuestionMastered,
    clearWrongQuestions,
  }), [
    clearWrongQuestions,
    data,
    isPending,
    markQuestionMastered,
    recordActivity,
    refetch,
    saveProgress,
    setFavorite,
    signOut,
    syncMessage,
    syncState,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
