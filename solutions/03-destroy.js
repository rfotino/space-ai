// Level: Destroy
// Strategy: equip the starting rocket and fire it directly at the target.
var target = radar({ objective: 'destroy' })[0];
if (target) {
  equip('rocket');
  fire(target.pos.x - pos().x, target.pos.y - pos().y);
}
