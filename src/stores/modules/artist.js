import { defineStore } from 'pinia'

export const useArtistStore = defineStore('ArtistStore', {
  state: () => ({
    artistInfo: null,
  }),
  actions: {
    setArtistInfo(info) {
      this.artistInfo = info
    },
  },
}) 