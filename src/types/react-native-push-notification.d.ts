declare module 'react-native-push-notification' {
  interface LocalNotification {
    /* minimal props used by this project */
    channelId?: string;
    autoCancel?: boolean;
    smallIcon?: string;
    vibrate?: boolean;
    vibration?: number;
    priority?: 'high' | 'max' | 'low' | 'min' | 'default';
    importance?: 'high' | 'default' | 'low' | 'min' | 'none';
    title?: string;
    message?: string;
    playSound?: boolean;
    soundName?: string;
    userInfo?: { [k: string]: any };
  }

  function createChannel(options: { channelId: string; channelName: string; channelDescription?: string; importance?: number; vibrate?: boolean; }, callback?: (created: boolean) => void): void;
  function localNotification(notification: LocalNotification): void;

  const PushNotification: {
    createChannel: typeof createChannel;
    localNotification: typeof localNotification;
  };

  export default PushNotification;
}
