# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e/forms.spec.ts >> Forms E2E >> Add → Edit → Delete flows for main forms
- Location: tests/e2e/forms.spec.ts:9:7

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=f7e1]:
  - generic [ref=f7e2]:
    - navigation [ref=f7e3]:
      - generic [ref=f7e5]:
        - generic [ref=f7e6]:
          - link "🏠 ResidenceOS" [ref=f7e7] [cursor=pointer]:
            - /url: /app
            - generic [ref=f7e8]: 🏠
            - generic [ref=f7e9]: ResidenceOS
          - generic [ref=f7e10]:
            - link "Dashboard" [ref=f7e11] [cursor=pointer]:
              - /url: /app
            - link "Spaces" [ref=f7e12] [cursor=pointer]:
              - /url: /app/spaces
            - link "Assets" [ref=f7e13] [cursor=pointer]:
              - /url: /app/assets
            - link "Tasks" [ref=f7e14] [cursor=pointer]:
              - /url: /app/tasks
            - link "Budget" [ref=f7e15] [cursor=pointer]:
              - /url: /app/budget
            - link "Warranties" [ref=f7e16] [cursor=pointer]:
              - /url: /app/warranties
            - link "Systems" [ref=f7e17] [cursor=pointer]:
              - /url: /app/systems
            - link "Reports" [ref=f7e18] [cursor=pointer]:
              - /url: /app/reports
        - generic [ref=f7e19]:
          - button "🌙" [ref=f7e20]
          - button "Logout" [ref=f7e21]
    - main [ref=f7e22]:
      - generic [ref=f7e24]:
        - generic [ref=f7e25]:
          - heading "Tasks" [level=1] [ref=f7e26]
          - button "Add Task" [ref=f7e27]
        - generic [ref=f7e29]:
          - generic [ref=f7e30]:
            - button [ref=f7e31]
            - generic [ref=f7e34]:
              - heading "Upload all bids" [level=3] [ref=f7e35]
              - generic [ref=f7e36]:
                - generic [ref=f7e37]: 📍 ADU Kitchen
                - generic [ref=f7e38]: medium
            - generic [ref=f7e39]:
              - button [ref=f7e40]
              - button [ref=f7e44]
              - button [ref=f7e47]
          - generic [ref=f7e51]:
            - button [ref=f7e52]
            - generic [ref=f7e55]:
              - heading "E2E Task 1786378289275" [level=3] [ref=f7e56]
              - generic [ref=f7e57]:
                - generic [ref=f7e58]: 📍 ADU Kitchen
                - generic [ref=f7e59]: medium
            - generic [ref=f7e60]:
              - button [ref=f7e61]
              - button [ref=f7e65]
              - button [ref=f7e68]
  - button "Open Next.js Dev Tools" [ref=f7e77] [cursor=pointer]
  - alert [ref=f7e81]
```