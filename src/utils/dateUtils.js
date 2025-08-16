export class DateUtils {
    constructor(date) {
        this.date = date ? date : new Date();
    }

    // 获取年份
    getYear() {
        return this.date.getFullYear();
    }

    // 获取月份 (0-11, 因此加1)
    getMonth() {
        return this.date.getMonth() + 1;
    }

    // 获取日期
    getDate() {
        return this.date.getDate();
    }

    // 获取小时
    getHours() {
        return this.date.getHours();
    }

    // 获取分钟
    getMinutes() {
        return this.date.getMinutes();
    }

    // 获取秒钟
    getSeconds() {
        return this.date.getSeconds();
    }

    // 格式化为字符串 YYYY-MM-DD HH:mm:ss
    formatDateTime() {
        const year = this.getYear();
        const month = String(this.getMonth()).padStart(2, '0');
        const date = String(this.getDate()).padStart(2, '0');
        const hours = String(this.getHours()).padStart(2, '0');
        const minutes = String(this.getMinutes()).padStart(2, '0');
        const seconds = String(this.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    }

    // 获取完整的日期字符串 YYYY-MM-DD
    formatDate() {
        const year = this.getYear();
        const month = String(this.getMonth()).padStart(2, '0');
        const date = String(this.getDate()).padStart(2, '0');

        return `${year}-${month}-${date}`;
    }

    // 获取完整的时间字符串 HH:mm:ss
    formatTime() {
        const hours = String(this.getHours()).padStart(2, '0');
        const minutes = String(this.getMinutes()).padStart(2, '0');
        const seconds = String(this.getSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }
} 