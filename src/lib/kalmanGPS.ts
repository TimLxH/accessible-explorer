// Filtro Kalman simplificado para coordenadas GPS.
// Reduce el ruido de lecturas sucesivas y produce una posición estimada.
export class KalmanGPS {
  private lat: number | null = null;
  private lng: number | null = null;
  private variance: number = -1;
  private readonly Q = 3; // ruido del proceso (m/s)
  private readonly minAccuracy = 1;
  private _lastTs = 0;

  filter(
    lat: number,
    lng: number,
    accuracy: number,
    timestampMs: number,
  ): { lat: number; lng: number } {
    const acc = Math.max(accuracy, this.minAccuracy);
    if (this.variance < 0) {
      this.lat = lat;
      this.lng = lng;
      this.variance = acc * acc;
      this._lastTs = timestampMs;
      return { lat, lng };
    }
    const dt = Math.max((timestampMs - this._lastTs) / 1000, 0.001);
    this._lastTs = timestampMs;
    this.variance += dt * this.Q * this.Q;
    const K = this.variance / (this.variance + acc * acc);
    this.lat = this.lat! + K * (lat - this.lat!);
    this.lng = this.lng! + K * (lng - this.lng!);
    this.variance = (1 - K) * this.variance;
    return { lat: this.lat, lng: this.lng };
  }

  reset() {
    this.lat = null;
    this.lng = null;
    this.variance = -1;
    this._lastTs = 0;
  }
}
