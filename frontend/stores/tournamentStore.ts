import { create } from 'zustand';
import { Tournament, TournamentParticipant, TournamentRanking } from '../types';

interface TournamentStore {
    tournaments: Tournament[];
    selectedTournament: Tournament | null;
    leaderboard: TournamentRanking[];
    myParticipation: TournamentParticipant | null;
    isLoading: boolean;

    // Actions
    setTournaments: (tournaments: Tournament[]) => void;
    setSelectedTournament: (tournament: Tournament | null) => void;
    setLeaderboard: (leaderboard: TournamentRanking[]) => void;
    setMyParticipation: (participation: TournamentParticipant | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    reset: () => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
    tournaments: [],
    selectedTournament: null,
    leaderboard: [],
    myParticipation: null,
    isLoading: false,

    setTournaments: (tournaments) => set({ tournaments }),
    setSelectedTournament: (tournament) => set({ selectedTournament: tournament }),
    setLeaderboard: (leaderboard) => set({ leaderboard }),
    setMyParticipation: (participation) => set({ myParticipation: participation }),
    setIsLoading: (isLoading) => set({ isLoading }),

    reset: () =>
        set({
            tournaments: [],
            selectedTournament: null,
            leaderboard: [],
            myParticipation: null,
            isLoading: false,
        }),
}));
