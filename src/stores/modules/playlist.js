import { defineStore } from 'pinia'

export const usePlaylistStore = defineStore('PlaylistStore', {
  state: () => ({
    playlist: null,
    songs: [],
  }),
  actions: {
    setPlaylistInfo(info) {
      this.playlist = info
    },
    setSongs(songs) {
      this.songs = songs
    },
  },
}) 