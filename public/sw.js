self.addEventListener("push", (event) => {
  let data = { title: "LEE YEON", body: "", href: "/notifications" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // keep defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "LEE YEON", {
      body: data.body || "",
      data: { href: data.href || "/notifications" },
      icon: "/brand/leeyeon-hero.jpg",
      badge: "/brand/leeyeon-hero.jpg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/notifications";
  const targetUrl = new URL(href, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
