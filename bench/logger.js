import {
  named,
  writable,
  computed,
  configure,
  effect,
  createLogger,
} from '/dist/index.mjs';

const button = document.getElementById('run');

configure({
  logger: createLogger({
    exclude: ['NOTIFY_START', 'NOTIFY_END'],
  }),
});

function fetchUser(id) {
  return fetch(`https://swapi.dev/api/people/${id}`).then((res) => res.json());
}

const userFx = effect(fetchUser, 'userFx');
const { data, status, call } = userFx;

const userName = named(
  computed(() => data() && data().name),
  'userName'
);

userName.subscribe(() => {});
data.subscribe((user) => {});

let id = 1;

function bench() {
  call(id++);
}

button.addEventListener('click', bench);
