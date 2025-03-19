"use strict";(()=>{var e={};e.id=267,e.ids=[267],e.modules={30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78018:e=>{e.exports=require("puppeteer")},71017:e=>{e.exports=require("path")},52292:(e,t,o)=>{o.r(t),o.d(t,{headerHooks:()=>w,originalPathname:()=>y,patchFetch:()=>x,requestAsyncStorage:()=>g,routeModule:()=>h,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m,staticGenerationBailout:()=>v});var i={};o.r(i),o.d(i,{POST:()=>d,dynamic:()=>u,runtime:()=>c});var r=o(95419),a=o(69108),n=o(99678),s=o(78070);let l=null,p=null;try{l=o(78018),p=o(71017)}catch(e){console.warn("Modules natifs non disponibles pendant la compilation",e)}let u="force-dynamic",c="nodejs";async function d(e){try{if(!l||!p)return console.warn("Modules natifs requis non disponibles - environnement de compilation"),s.Z.json({success:!1,message:"This function requires Node.js modules which are only available at runtime"},{status:503});let{text:t,style:o,position:i,offset:r}=await e.json(),a=await l.launch({headless:!0}),n=await a.newPage();await n.setViewport({width:1080,height:1920,deviceScaleFactor:2});let u=`
      <html>
        <head>
          <style>
            :root {
              --color-bg: transparent;
              --color-highlight: #fff;
              --font: 'TikTok Display Medium', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            }
            
            @font-face {
              font-family: 'TikTok Display Medium';
              src: url('${p.join(process.cwd(),"public/fonts/TikTokDisplay-Medium.ttf")}');
            }

            body {
              margin: 0;
              width: 1080px;
              height: 1920px;
              display: flex;
              align-items: ${"top"===i?"flex-start":"middle"===i?"center":"flex-end"};
              justify-content: center;
              padding: ${"top"===i?"300px":"bottom"===i?"300px":"0px"} 0;
              background: var(--color-bg);
              font-family: var(--font);
            }

            h1 {
              width: 100%;
              text-align: center;
            }

            .goo {
              font-size: 75px;
              line-height: 1.2;
              display: inline;
              box-decoration-break: clone;
              background: var(--color-highlight);
              padding: 0.3rem 1.5rem 1rem 1.5rem;
              filter: url('#goo');
              transform: translateY(${r}px);
              max-width: 85%;
              text-align: center;
              color: #000;
              font-weight: normal;
            }

            .goo:focus {
              outline: 0;
            }
          </style>
        </head>
        <body>
          <h1>
            <div class="goo">${t}</div>
          </h1>

          <svg style="visibility: hidden; position: absolute;" width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
            <defs>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />    
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
              </filter>
            </defs>
          </svg>
        </body>
      </html>
    `;await n.setContent(u);let c=await n.screenshot({omitBackground:!0,type:"png"});return await a.close(),new s.Z(c,{headers:{"Content-Type":"image/png","Content-Disposition":'inline; filename="hook-preview.png"'}})}catch(e){return console.error("Error generating hook preview:",e),s.Z.json({error:"Failed to generate hook preview"},{status:500})}}let h=new r.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/create-hook-preview/route",pathname:"/api/create-hook-preview",filename:"route",bundlePath:"app/api/create-hook-preview/route"},resolvedPagePath:"/Users/twain/Bluum/BLUUM 1.2/Bluum_1.2/app/api/create-hook-preview/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:g,staticGenerationAsyncStorage:m,serverHooks:f,headerHooks:w,staticGenerationBailout:v}=h,y="/api/create-hook-preview/route";function x(){return(0,n.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}}};var t=require("../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),i=t.X(0,[638,206],()=>o(52292));module.exports=i})();