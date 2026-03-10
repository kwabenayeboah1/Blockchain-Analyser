
export const priceService = {
  async getBTCPriceInGBP(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=gbp');
      if (!response.ok) throw new Error('Price fetch failed');
      const data = await response.json();
      return data.bitcoin.gbp;
    } catch (error) {
      console.error('Failed to fetch BTC price:', error);
      return 0;
    }
  }
};
