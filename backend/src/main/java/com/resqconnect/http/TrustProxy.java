package com.resqconnect.http;

import java.math.BigInteger;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

public final class TrustProxy {
    private static final int MAX_PROXY_HOPS = 10;
    private static final Pattern IPV4 = Pattern.compile("^(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$");
    private static final Pattern IPV6_CHARS = Pattern.compile("^[0-9A-Fa-f:.]+(%[0-9A-Za-z_.~-]+)?$");

    private enum Mode { NONE, ALL, HOPS, LIST }

    private record Subnet(byte[] network, int prefix) {
    }

    private final Mode mode;
    private final int hops;
    private final List<Subnet> subnets;
    private final Object description;

    private TrustProxy(Mode mode, int hops, List<Subnet> subnets, Object description) {
        this.mode = mode;
        this.hops = hops;
        this.subnets = subnets;
        this.description = description;
    }

    public Object description() {
        return description;
    }

    public static TrustProxy parse(String raw) {
        String value = raw == null ? "" : raw.trim();
        if (value.isEmpty()) {
            return new TrustProxy(Mode.NONE, 0, List.of(), false);
        }
        String lower = value.toLowerCase(Locale.ROOT);
        if (lower.equals("false")) {
            return new TrustProxy(Mode.NONE, 0, List.of(), false);
        }
        if (lower.equals("true")) {
            return new TrustProxy(Mode.ALL, 0, List.of(), true);
        }
        if (value.matches("^\\d+$")) {
            int count;
            try {
                count = Integer.parseInt(value);
            } catch (NumberFormatException e) {
                count = Integer.MAX_VALUE;
            }
            if (count > MAX_PROXY_HOPS) {
                throw new IllegalArgumentException("Invalid TRUST_PROXY value \"" + value + "\". Use a proxy hop count between 0 and " + MAX_PROXY_HOPS + ".");
            }
            return count == 0 ? new TrustProxy(Mode.NONE, 0, List.of(), false) : new TrustProxy(Mode.HOPS, count, List.of(), count);
        }
        List<String> entries = new ArrayList<>();
        for (String entry : lower.split(",")) {
            String trimmed = entry.trim();
            if (!trimmed.isEmpty()) {
                entries.add(trimmed);
            }
        }
        boolean valid = !entries.isEmpty();
        for (String entry : entries) {
            valid = valid && isValidEntry(entry);
        }
        if (!valid) {
            throw new IllegalArgumentException("Invalid TRUST_PROXY value \"" + value + "\". Use false, true, a proxy hop count such as 1, or a comma-separated list of IP addresses, CIDR ranges, loopback, linklocal or uniquelocal.");
        }
        List<Subnet> subnets = new ArrayList<>();
        for (String entry : entries) {
            switch (entry) {
                case "loopback" -> {
                    subnets.add(subnet("127.0.0.1/8"));
                    subnets.add(subnet("::1/128"));
                }
                case "linklocal" -> {
                    subnets.add(subnet("169.254.0.0/16"));
                    subnets.add(subnet("fe80::/10"));
                }
                case "uniquelocal" -> {
                    subnets.add(subnet("10.0.0.0/8"));
                    subnets.add(subnet("172.16.0.0/12"));
                    subnets.add(subnet("192.168.0.0/16"));
                    subnets.add(subnet("fc00::/7"));
                }
                default -> subnets.add(subnet(entry));
            }
        }
        return new TrustProxy(Mode.LIST, 0, subnets, entries);
    }

    private static boolean isValidEntry(String entry) {
        if (entry.equals("loopback") || entry.equals("linklocal") || entry.equals("uniquelocal")) {
            return true;
        }
        String[] parts = entry.split("/", -1);
        if (parts.length > 2) {
            return false;
        }
        int family = ipFamily(parts[0]);
        if (family == 0) {
            return false;
        }
        if (parts.length == 1) {
            return true;
        }
        if (!parts[1].matches("^\\d{1,3}$")) {
            return false;
        }
        return Integer.parseInt(parts[1]) <= (family == 4 ? 32 : 128);
    }

    static int ipFamily(String text) {
        if (IPV4.matcher(text).matches()) {
            return 4;
        }
        if (text.indexOf(':') >= 0 && IPV6_CHARS.matcher(text).matches()) {
            byte[] bytes = parseAddress(text);
            return bytes != null && bytes.length == 16 ? 6 : 0;
        }
        return 0;
    }

    static byte[] parseAddress(String text) {
        if (text == null) {
            return null;
        }
        String value = text.trim();
        if (value.startsWith("[") && value.endsWith("]")) {
            value = value.substring(1, value.length() - 1);
        }
        if (IPV4.matcher(value).matches()) {
            String[] parts = value.split("\\.");
            byte[] bytes = new byte[4];
            for (int i = 0; i < 4; i++) {
                bytes[i] = (byte) Integer.parseInt(parts[i]);
            }
            return bytes;
        }
        if (value.indexOf(':') < 0 || !IPV6_CHARS.matcher(value).matches()) {
            return null;
        }
        try {
            InetAddress address = InetAddress.getByName(value);
            if (address instanceof Inet6Address || address instanceof Inet4Address) {
                return address.getAddress();
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private static Subnet subnet(String entry) {
        String[] parts = entry.split("/");
        byte[] network = parseAddress(parts[0]);
        int max = network.length * 8;
        int prefix = parts.length > 1 ? Integer.parseInt(parts[1]) : max;
        return new Subnet(network, prefix);
    }

    private static byte[] normalize(byte[] address) {
        if (address != null && address.length == 16) {
            boolean mapped = true;
            for (int i = 0; i < 10; i++) {
                mapped = mapped && address[i] == 0;
            }
            mapped = mapped && address[10] == (byte) 0xff && address[11] == (byte) 0xff;
            if (mapped) {
                return new byte[]{address[12], address[13], address[14], address[15]};
            }
        }
        return address;
    }

    private boolean trusted(String addressText, int index) {
        switch (mode) {
            case ALL:
                return true;
            case HOPS:
                return index < hops;
            case LIST:
                byte[] address = normalize(parseAddress(addressText));
                if (address == null) {
                    return false;
                }
                for (Subnet subnet : subnets) {
                    if (contains(subnet, address)) {
                        return true;
                    }
                }
                return false;
            default:
                return false;
        }
    }

    private static boolean contains(Subnet subnet, byte[] address) {
        byte[] network = subnet.network();
        if (network.length != address.length) {
            return false;
        }
        int bits = network.length * 8;
        BigInteger mask = BigInteger.ONE.shiftLeft(bits).subtract(BigInteger.ONE)
                .xor(BigInteger.ONE.shiftLeft(bits - subnet.prefix()).subtract(BigInteger.ONE));
        BigInteger a = new BigInteger(1, address).and(mask);
        BigInteger n = new BigInteger(1, network).and(mask);
        return a.equals(n);
    }

    public String clientIp(String remoteAddress, String forwardedFor) {
        List<String> addresses = new ArrayList<>();
        addresses.add(remoteAddress);
        if (forwardedFor != null) {
            String[] parts = forwardedFor.split(",");
            for (int i = parts.length - 1; i >= 0; i--) {
                String part = parts[i].trim();
                if (!part.isEmpty()) {
                    addresses.add(part);
                }
            }
        }
        if (mode == Mode.NONE) {
            return remoteAddress;
        }
        int keep = addresses.size();
        for (int i = 0; i < addresses.size() - 1; i++) {
            if (!trusted(addresses.get(i), i)) {
                keep = i + 1;
                break;
            }
        }
        return addresses.get(keep - 1);
    }
}
