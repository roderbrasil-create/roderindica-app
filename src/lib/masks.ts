/**
 * Formats a phone number as (XX) XXXXX-XXXX
 */
export const maskPhone = (value: string): string => {
  if (!value) return "";
  
  // Clean all non-digits to analyze the structure
  let numbers = value.replace(/\D/g, "");
  
  // If the number was entered/pasted with the 55 country code (e.g. 12 or 13 digits starting with 55)
  // or is even longer and starts with 55, strip the 55 prefix.
  if (numbers.length >= 12 && numbers.startsWith("55")) {
    numbers = numbers.substring(2);
  }
  
  return numbers
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
};

/**
 * Formats a CPF as XXX.XXX.XXX-XX
 */
export const maskCPF = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .substring(0, 14);
};

/**
 * Formats a CNPJ as XX.XXX.XXX/XXXX-XX
 */
export const maskCNPJ = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 18);
};

/**
 * Formats either CPF or CNPJ based on length
 */
export const maskCpfCnpj = (value: string): string => {
  if (!value) return "";
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    return maskCPF(value);
  }
  return maskCNPJ(value);
};

/**
 * Formats a number as R$ X.XXX,XX
 */
export const maskCurrency = (value: string | number): string => {
  const amount = typeof value === 'string' 
    ? parseFloat(value.replace(/\D/g, '')) / 100 
    : value;
  
  if (isNaN(amount)) return "R$ 0,00";

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

/**
 * Strips formatting from currency string to return a number
 */
export const unmaskCurrency = (value: string): number => {
  if (!value) return 0;
  const numbers = value.replace(/\D/g, "");
  return parseFloat(numbers) / 100;
};
