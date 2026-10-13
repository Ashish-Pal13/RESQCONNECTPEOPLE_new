package com.resqconnect.domain;

import com.resqconnect.util.Js;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

public final class Phone {
    public static final String DEFAULT_COUNTRY = "IN";
    public static final String OTHER_COUNTRY = "OTHER";
    private static final Pattern INTERNATIONAL = Pattern.compile("^\\+[1-9]\\d{6,14}$");
    private static final Pattern DIGITS = Pattern.compile("^\\d+$");

    public record Country(String code, String name, String dial, int min, int max, Pattern lead, String leadMessage) {
    }

    public record Result(String e164, String country, String error) {
        static Result error(String message) {
            return new Result(null, null, message);
        }
    }

    public static final List<Country> COUNTRIES = List.of(
            new Country("IN", "India", "+91", 10, 10, Pattern.compile("^[6-9]"), "Indian mobile numbers start with 6, 7, 8 or 9."),
            new Country("NP", "Nepal", "+977", 7, 10, null, null),
            new Country("BD", "Bangladesh", "+880", 10, 10, null, null),
            new Country("BT", "Bhutan", "+975", 7, 8, null, null),
            new Country("LK", "Sri Lanka", "+94", 9, 9, null, null),
            new Country("PK", "Pakistan", "+92", 10, 10, null, null),
            new Country("MV", "Maldives", "+960", 7, 7, null, null),
            new Country("AE", "United Arab Emirates", "+971", 8, 9, null, null),
            new Country("SA", "Saudi Arabia", "+966", 9, 9, null, null),
            new Country("QA", "Qatar", "+974", 8, 8, null, null),
            new Country("OM", "Oman", "+968", 8, 8, null, null),
            new Country("KW", "Kuwait", "+965", 8, 8, null, null),
            new Country("SG", "Singapore", "+65", 8, 8, null, null),
            new Country("MY", "Malaysia", "+60", 9, 10, null, null),
            new Country("CN", "China", "+86", 11, 11, null, null),
            new Country("JP", "Japan", "+81", 9, 10, null, null),
            new Country("AU", "Australia", "+61", 9, 9, null, null),
            new Country("NZ", "New Zealand", "+64", 8, 10, null, null),
            new Country("GB", "United Kingdom", "+44", 9, 10, null, null),
            new Country("DE", "Germany", "+49", 6, 13, null, null),
            new Country("FR", "France", "+33", 9, 9, null, null),
            new Country("ZA", "South Africa", "+27", 9, 9, null, null),
            new Country("US", "United States", "+1", 10, 10, Pattern.compile("^[2-9]"), "US numbers cannot start with 0 or 1."),
            new Country("CA", "Canada", "+1", 10, 10, Pattern.compile("^[2-9]"), "Canadian numbers cannot start with 0 or 1."));

    private static final Map<String, Country> BY_CODE = new LinkedHashMap<>();

    static {
        for (Country country : COUNTRIES) {
            BY_CODE.put(country.code(), country);
        }
    }

    private Phone() {
    }

    public static Country find(String code) {
        return code == null ? null : BY_CODE.get(code);
    }

    private static String compact(String value) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (Js.isWhitespace(c) || c == '-' || c == '(' || c == ')' || c == '.') {
                continue;
            }
            out.append(c);
        }
        return out.toString();
    }

    public static Result validate(String countryCode, String raw) {
        String value = raw == null ? "" : Js.trim(raw);
        if (value.isEmpty()) {
            return Result.error("Enter a phone number.");
        }
        String compact = compact(value);
        if (OTHER_COUNTRY.equals(countryCode)) {
            if (!INTERNATIONAL.matcher(compact).matches()) {
                return Result.error("Enter the full international number, starting with + and the country code, for example +4915123456789.");
            }
            return new Result(compact, OTHER_COUNTRY, null);
        }
        Country country = find(countryCode);
        if (country == null) {
            return Result.error("Choose a country code.");
        }
        String national = compact;
        if (national.startsWith(country.dial())) {
            national = national.substring(country.dial().length());
        } else if (national.startsWith("+")) {
            return Result.error("This number has a different country code. Choose the matching country, or choose \"Other country\".");
        }
        if (!DIGITS.matcher(national).matches()) {
            return Result.error("Use digits only, without letters or symbols.");
        }
        if (national.startsWith("0") && national.length() > country.min()) {
            national = national.substring(1);
        }
        String range = country.min() == country.max() ? String.valueOf(country.min()) : country.min() + " to " + country.max();
        if (national.length() < country.min() || national.length() > country.max()) {
            return Result.error(country.name() + " numbers have " + range + " digits after " + country.dial() + ".");
        }
        if (country.lead() != null && !country.lead().matcher(national).find()) {
            return Result.error(country.leadMessage());
        }
        String e164 = country.dial() + national;
        if (e164.length() - 1 > 15) {
            return Result.error("This phone number is too long.");
        }
        return new Result(e164, country.code(), null);
    }

    public static String format(String e164, String countryCode) {
        if (e164 == null || e164.isEmpty()) {
            return "";
        }
        Country country = find(countryCode);
        if (country == null || !e164.startsWith(country.dial())) {
            return e164;
        }
        String national = e164.substring(country.dial().length());
        if ("IN".equals(country.code()) && national.length() == 10) {
            return country.dial() + " " + national.substring(0, 5) + " " + national.substring(5);
        }
        return country.dial() + " " + national;
    }
}
