export function createDotMotion(x=0,y=0){return {x,y,radius:0,energy:0}}
const damp=(a,b,dt,tau)=>a+(b-a)*(1-Math.exp(-dt/tau));

// Position and influence have different response times. The gap from the pointer
// acts as a speed signal, matching the reference's delayed-position mechanism.
export function stepDotMotion(state,x,y,dt,active=true){
 dt=Math.max(0,Math.min(.05,dt));
 const gap=Math.hypot(x-state.x,y-state.y);
 const radius=active?Math.min(100,gap*1.1):0,energy=active?Math.min(1,gap/75):0;
 state.x=damp(state.x,x,dt,.14);state.y=damp(state.y,y,dt,.14);
 state.radius=damp(state.radius,radius,dt,radius>state.radius ? .18 : .42);
 state.energy=damp(state.energy,energy,dt,energy>state.energy ? .13 : .32);
 if(Math.hypot(x-state.x,y-state.y)<.08&&state.radius<.2&&state.energy<.002){state.x=x;state.y=y;state.radius=0;state.energy=0;return false}
 return true;
}

function mixBits(value){value=Math.imul(value^(value>>>16),0x45d9f3b);value=Math.imul(value^(value>>>16),0x45d9f3b);return (value^(value>>>16))>>>0}
// Every mark has the weighted shape mix; only a quarter flicker or swap shapes.
export function dotMark(col,row,now,animate=true){
 const seed=mixBits(Math.imul(col,73856093)^Math.imul(row,19349663));
 const changing=animate&&seed%4===0,period=110+seed%5*23;
 const bucket=Math.floor((now+(seed>>>8)%1000)/period);
 const noise=changing?mixBits(seed^Math.imul(bucket,0x9e3779b9)):mixBits(seed^0x85ebca6b);
 const weight=(noise>>>8)%1000,shape=weight<100?0:weight<400?1:weight<750?2:3;
 return {shape,brightness:changing?((noise&7)===0?.22:.55+(noise>>>16)%45/100):1};
}

export function dotTrailOpacity(age){
 if(age<=220)return 1;if(age>=540)return 0;
 const t=(age-220)/320;return 1-t*t*(3-2*t);
}

// Never overwrite a visible trail peak with the weak edge of the moving field.
export function retainDotTrail(previous,sample,now){
 if(previous&&previous.alpha*dotTrailOpacity(now-previous.seen)>sample.alpha)return previous;
 return {...sample,seen:now};
}
