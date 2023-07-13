export type ADSRType = {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
};
export type DisplayEnvelopeProps = {
    envelope: Partial<ADSRType>;
    strokeColor: string;
    fillColor: string;
};
