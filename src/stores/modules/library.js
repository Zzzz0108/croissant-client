import { defineStore } from 'pinia'

export const useLibraryStore = defineStore('LibraryStore', {
  state: () => ({
    tableData: null,
  }),
  actions: {
    setTableData(data) {
      this.tableData = data
    },
  },
}) 