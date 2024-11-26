import { Runtime } from "../chrome-api/runtime";
import { logChannel } from "./controllers/messages";
import { appStorage } from "./controllers/storage";

Runtime.onInstall({
  onAll: async () => {
    await appStorage.setup();
    await appStorage.clear();
    await appStorage.setup();
    console.log(await appStorage.getAll());
  },
});

logChannel.listen(({ message }) => {
  console.log(message);
});
