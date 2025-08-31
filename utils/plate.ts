export const normalizePlate = (s: string) =>
    s.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);

export const isBRPlate = (s: string) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(s);

export const isOldBRPlate = (s: string) => /^[A-Z]{3}[0-9]{4}$/.test(s);

export const maskBRPlate = (value: string) => {
    let plate = value.replace(/[^A-Z0-9]/g, "");

    if (plate.length <= 3) {
        return plate;
    }

    if (plate[4] && /[0-9]/.test(plate[4])) {
        return plate.replace(/^([A-Z]{3})([0-9]{0,4}).*/, "$1-$2").substring(0, 8);
    } else {
        return plate.replace(/^([A-Z]{3})([0-9]{1})([A-Z0-9]?)([0-9]{0,2}).*/, "$1$2$3$4").substring(0, 7);
    }
};