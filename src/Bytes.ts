export default class Bytes {
  constructor(initialBytesValue?: number);
  constructor(private value?: number) {
    this.value ??= 0;
  }
  
  private static readonly denominatorKB = 1024;
  private static readonly denominatorMB = 1048576;
  private static readonly denominatorGB = 1073741824;
  private static readonly denominatorTB = 1099511627776;

  public valueOf(): number {
    return this.value;
  }
  
  public toString(fractionDigits?: number): string {
    if (this.value < Bytes.denominatorKB) {
      return `${this.value} B`;
    } else if (this.value < Bytes.denominatorMB) {
      let value: any = this.value / Bytes.denominatorKB;
      if (fractionDigits !== undefined) value = value.toFixed(fractionDigits);
      return `${value} KB`;
    } else if (this.value < Bytes.denominatorGB) {
      let value: any = this.value / Bytes.denominatorMB;
      if (fractionDigits !== undefined) value = value.toFixed(fractionDigits);
      return `${value} MB`;
    } else if (this.value < Bytes.denominatorTB) {
      let value: any = this.value / Bytes.denominatorGB;
      if (fractionDigits !== undefined) value = value.toFixed(fractionDigits);
      return `${value} GB`;
    } else {
      let value: any = this.value / Bytes.denominatorTB;
      if (fractionDigits !== undefined) value = value.toFixed(fractionDigits);
      return `${value} TB`;
    }
  }

  public toAuto(): number {
    if (this.value < Bytes.denominatorKB) {
      return this.value;
    } else if (this.value < Bytes.denominatorMB) {
      return this.toKB();
    } else if (this.value < Bytes.denominatorGB) {
      return this.toMB();
    } else if (this.value < Bytes.denominatorTB) {
      return this.toGB();
    } else {
      return this.toTB();
    }
  }

  public toBytes(): number {
    return this.value;
  }

  public toKB(): number {
    return this.value / Bytes.denominatorKB;
  }

  public toMB(): number {
    return this.value / Bytes.denominatorMB;
  }

  public toGB(): number {
    return this.value / Bytes.denominatorGB;
  }

  public toTB(): number {
    return this.value / Bytes.denominatorTB;
  }

  public addBytes(value: number) {
    this.value =+ value;
  }

  public addKB(value: number) {
    this.value =+ value * Bytes.denominatorKB;
  }

  public addMB(value: number) {
    this.value =+ value * Bytes.denominatorMB;
  }

  public addGB(value: number) {
    this.value =+ value * Bytes.denominatorGB;
  }

  public addTB(value: number) {
    this.value =+ value * Bytes.denominatorTB;
  }

  public static fromBytes(value: number): Bytes {
    return new Bytes(value);
  }

  public static fromKB(value: number): Bytes {
    return new Bytes(value * Bytes.denominatorKB);
  }

  public static fromMB(value: number): Bytes {
    return new Bytes(value * Bytes.denominatorMB);
  }

  public static fromGB(value: number): Bytes {
    return new Bytes(value * Bytes.denominatorGB);
  }

  public static fromTB(value: number): Bytes {
    return new Bytes(value * Bytes.denominatorTB);
  }

  

}