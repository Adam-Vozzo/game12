export class OceanAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sea: AudioBufferSourceNode | null = null;
  muted = true;
  async setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      if (this.master)
        this.master.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.15);
      return;
    }
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      const buffer = this.ctx.createBuffer(
        1,
        this.ctx.sampleRate * 3,
        this.ctx.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < samples.length; i++) {
        last = (last + Math.random() * 0.12 - 0.06) / 1.02;
        samples[i] = last * 1.8;
      }
      this.sea = this.ctx.createBufferSource();
      this.sea.buffer = buffer;
      this.sea.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 550;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.12;
      this.sea.connect(filter).connect(gain).connect(this.master);
      this.sea.start();
    }
    await this.ctx.resume();
    this.master!.gain.setTargetAtTime(0.3, this.ctx.currentTime, 0.2);
  }
  play(kind: string) {
    if (this.muted || !this.ctx || !this.master) return;
    const notes =
      kind === 'catch' || kind === 'discovery'
        ? [392, 523, 659, 784]
        : kind === 'warning'
          ? [220, 196]
          : kind === 'hook'
            ? [440, 587]
            : [523, 659];
    notes.forEach((frequency, i) => {
      const o = this.ctx!.createOscillator(),
        g = this.ctx!.createGain(),
        t = this.ctx!.currentTime + i * 0.1;
      o.type = 'sine';
      o.frequency.value = frequency;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 0.6);
    });
  }
  dispose() {
    this.sea?.stop();
    void this.ctx?.close();
  }
}
