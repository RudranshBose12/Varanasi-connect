self.addEventListener('push',event=>{
  let payload={title:'Varanasi Connect',body:'There is an update about a community event.',url:'/events'};
  try{if(event.data)payload=Object.assign(payload,event.data.json());}catch(error){console.warn('Could not read push notification payload.',error);}
  event.waitUntil(self.registration.showNotification(payload.title||'Varanasi Connect',{
    body:payload.body||'There is an update about a community event.',
    icon:'/assets/varanasi-connect-dark-logo.png',
    badge:'/assets/varanasi-connect-dark-logo.png',
    tag:payload.tag||'varanasi-connect-event',
    data:{url:payload.url||'/events'}
  }));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    let target=new URL('/events',self.location.origin);
    try{
      const requested=new URL(event.notification.data?.url||'/events',self.location.origin);
      if(requested.origin===self.location.origin)target=requested;
    }catch(error){console.warn('Invalid notification target.',error);}
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(client.url.startsWith(self.location.origin)&&'navigate' in client){await client.navigate(target.href);return client.focus();}
    }
    return self.clients.openWindow(target.href);
  })());
});
