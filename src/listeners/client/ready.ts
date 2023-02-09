import { Listener } from '#lib/structures';
import { Events } from '#lib/types/Events';

abstract class ReadyListener extends Listener<typeof Events.ClientReady> {
	public constructor() {
		super({
			name: Events.ClientReady,
		});
	}

	public async run() {
		console.log('Online!');
	}
}

export default ReadyListener;
