import { useAuthContext } from '../contexts/AuthContext';

export type { Profile } from '../contexts/AuthContext';

export function useAuth() {
    return useAuthContext();
}
