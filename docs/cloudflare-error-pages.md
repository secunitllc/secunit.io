# Cloudflare custom error pages

Self-contained, dark secunit templates for Cloudflare Error Pages. The HTML references only
`error.css`; Cloudflare fetches and inlines that stylesheet when the custom page is saved.

## Dashboard mapping

| Cloudflare page type                      | API identifier      | Template URL                                                  |
| ----------------------------------------- | ------------------- | ------------------------------------------------------------- |
| WAF block                                 | `waf_block`         | `https://secunit.io/cloudflare-errors/waf-block.html`         |
| IP/Country block                          | `ip_block`          | `https://secunit.io/cloudflare-errors/ip-block.html`          |
| IP/Country challenge                      | `country_challenge` | `https://secunit.io/cloudflare-errors/country-challenge.html` |
| 500 class errors                          | `500_errors`        | `https://secunit.io/cloudflare-errors/500-errors.html`        |
| 1000 class errors                         | `1000_errors`       | `https://secunit.io/cloudflare-errors/1000-errors.html`       |
| Managed challenge / I'm Under Attack Mode | `managed_challenge` | `https://secunit.io/cloudflare-errors/managed-challenge.html` |
| Rate limiting block                       | `ratelimit_block`   | `https://secunit.io/cloudflare-errors/rate-limit.html`        |

## Install

1. Deploy the site and confirm every template URL and `error.css` return `200`.
2. In Cloudflare, open the zone's **Error Pages** page.
3. Edit each page type, select **Custom page**, and enter the matching URL above.
4. Preview before confirming.
5. After changing a template, use **Fetch custom page again** even though its URL is unchanged.

The challenge and error templates include Cloudflare's required page-specific tokens. Every page
also includes `::RAY_ID::` and `::GEO::` for support context. Do not add a `referrer` meta tag:
Cloudflare documents that it disrupts challenge pages.

References:

- [Edit Error Pages](https://developers.cloudflare.com/rules/custom-errors/edit-error-pages/)
- [Error page types](https://developers.cloudflare.com/rules/custom-errors/reference/error-page-types/)
- [Error tokens](https://developers.cloudflare.com/rules/custom-errors/reference/error-tokens/)
